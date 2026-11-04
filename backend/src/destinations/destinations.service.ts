import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DestinationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { CreateFlightDto } from './dto/create-flight.dto';
import { UpdateFlightDto } from './dto/update-flight.dto';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';

// ── Interfaces para respuestas de APIs externas ────────────────────────────────

interface WeatherForecastItem {
  weather: { description: string }[];
  main: { temp_min: number; temp_max: number };
}

interface WeatherApiResponse {
  city: { name: string };
  list: WeatherForecastItem[];
}

interface HolidayItem {
  name: string;
  date: { iso: string };
  type: string[];
}

interface HolidayApiResponse {
  response: { holidays: HolidayItem[] };
}

export interface CachedHoliday {
  name: string;
  date: string;
  type: string;
  isReferential: boolean;
}

export interface CachedWeather {
  source: string;
  isReferential: boolean;
  city: string;
  forecast: { description: string; temp_min: number; temp_max: number }[];
}

interface DestinationQuery {
  type?: string;
  search?: string;
}

// TTLs de caché en milisegundos
const TTL_HOLIDAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const TTL_WEATHER_MS  =  3 * 60 * 60 * 1000;       //  3 horas

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async findAll(query: DestinationQuery) {
    const { type, search } = query;
    const where: Prisma.DestinationWhereInput = {
      isActive: true,
      ...(type ? { type: type as DestinationType } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const destinations = await this.prisma.destination.findMany({ where, orderBy: { name: 'asc' } });
    const withFromPrice = await Promise.all(
      destinations.map(async (dest) => {
        const cheapestFlight = await this.prisma.flight.findFirst({
          where: { destinationId: dest.id, isActive: true },
          orderBy: { pricePerPerson: 'asc' },
          select: { pricePerPerson: true },
        });
        return { ...dest, fromPrice: cheapestFlight ? Number(cheapestFlight.pricePerPerson) : null };
      }),
    );
    return withFromPrice;
  }

  async findOne(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        hotels: { where: { isActive: true }, orderBy: { stars: 'desc' } },
        activities: { where: { isActive: true }, orderBy: { type: 'asc' } },
        festivities: { where: { isActive: true } },
        arrivingFlights: { where: { isActive: true }, orderBy: { pricePerPerson: 'asc' } },
      },
    });
    if (!destination) throw new NotFoundException('Destino no encontrado');
    return destination;
  }

  async getContext(id: number, departureDate: string, returnDate: string) {
    const destination = await this.findOne(id);
    const dep = new Date(departureDate);
    const ret = new Date(returnDate);

    // Festividades que coinciden con las fechas del viaje.
    // Iteramos el rango de años del viaje para que festividades que cruzan de año
    // (ej. 24 dic → 6 ene) coincidan correctamente con viajes dic → ene.
    const matchingFestivities = destination.festivities.filter(f => {
      for (let year = dep.getUTCFullYear(); year <= ret.getUTCFullYear(); year++) {
        const festStart = new Date(Date.UTC(year, f.startMonth - 1, f.startDay));
        // Si la festividad cruza de año (endMonth < startMonth), el final cae en el año siguiente.
        const endYear = f.endMonth < f.startMonth ? year + 1 : year;
        const festEnd = new Date(Date.UTC(endYear, f.endMonth - 1, f.endDay));
        if (festStart <= ret && festEnd >= dep) return true;
      }
      return false;
    });

    // Clima via OpenWeatherMap (con caché de 3 horas)
    const weather = await this.getWeather(destination.id, destination.city, destination.countryCode, dep);

    // Feriados via Calendarific (con caché de 30 días)
    const holidays = await this.getHolidays(destination.countryCode, dep, ret);

    return {
      destination,
      festivities: matchingFestivities,
      weather,
      holidays,
      hotels: destination.hotels,
      activities: destination.activities,
    };
  }

  /**
   * Vuelos hacia un destino alrededor de la fecha pedida (±flexDays días), ordenados por cercanía a esa fecha
   * y luego por precio. Nunca devuelve vuelos que ya salieron.
   */
  async searchFlights(originIata: string, destinationId: number, departureDate: string, passengers: number, flexDays = 3) {
    const destination = await this.prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) throw new NotFoundException('Destino no encontrado');

    // Sin origen se buscan vuelos desde cualquier ciudad. Ojo: Prisma ignora un filtro undefined,
    // así que sin esta guarda tomaba el primer destino de la tabla como origen.
    const origin = originIata ? await this.prisma.destination.findFirst({ where: { iataCode: originIata } }) : null;

    const DAY = 86_400_000;
    const flexValue = Number(flexDays);
    const flex = Number.isFinite(flexValue) ? Math.min(Math.max(Math.floor(flexValue), 0), 7) : 3;
    const requested = new Date(`${departureDate}T00:00:00Z`);
    if (Number.isNaN(requested.getTime())) throw new BadRequestException('La fecha de salida no es válida');
    const from = new Date(Math.max(requested.getTime() - flex * DAY, Date.now()));
    const to = new Date(requested.getTime() + (flex + 1) * DAY);

    const flights = await this.prisma.flight.findMany({
      where: {
        destinationId,
        ...(origin ? { originId: origin.id } : {}),
        departureDate: { gte: from, lt: to },
        seatsAvailable: { gte: passengers },
        isActive: true,
      },
      include: { origin: true, destination: true },
    });

    const daysFrom = (d: Date) => Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - requested.getTime()) / DAY);
    return flights
      .map((f) => ({
        ...f,
        // Días de diferencia con la fecha pedida: 0 = ese mismo día, -2 = dos días antes, 1 = un día después.
        daysFromRequested: daysFrom(f.departureDate),
        totalPrice: Number(f.pricePerPerson) * passengers,
      }))
      .sort((a, b) => Math.abs(a.daysFromRequested) - Math.abs(b.daysFromRequested)
        || a.departureDate.getTime() - b.departureDate.getTime()
        || Number(a.pricePerPerson) - Number(b.pricePerPerson));
  }

  // ── Cache genérico ──────────────────────────────────────────────────────────

  /**
   * Lee una entrada del caché. Devuelve `null` si no existe o si está vencida
   * y `allowStale` es false. Con `allowStale: true` devuelve incluso datos vencidos.
   */
  private async readCache<T>(key: string, allowStale = false): Promise<T | null> {
    const entry = await this.prisma.externalApiCache.findUnique({ where: { cacheKey: key } });
    if (!entry) return null;
    if (!allowStale && entry.expiresAt <= new Date()) return null;
    return entry.data as T;
  }

  /** Guarda o actualiza una entrada del caché con el TTL indicado. */
  private async writeCache(key: string, data: unknown, ttlMs: number): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    await this.prisma.externalApiCache.upsert({
      where: { cacheKey: key },
      update: { data: data as Prisma.InputJsonValue, fetchedAt: now, expiresAt },
      create: { cacheKey: key, data: data as Prisma.InputJsonValue, fetchedAt: now, expiresAt },
    });
  }

  // ── Clima ───────────────────────────────────────────────────────────────────

  /**
   * Devuelve el clima para la ciudad en el mes de salida.
   * Orden: caché vigente → OpenWeatherMap (si hay clave) → caché vencido → dato de respaldo.
   * La propiedad `isReferential` indica si el dato proviene del respaldo de la base.
   */
  private async getWeather(destinationId: number, city: string, countryCode: string, dep: Date) {
    const year  = dep.getUTCFullYear();
    const month = String(dep.getUTCMonth() + 1).padStart(2, '0');
    const cacheKey = `weather:${city}:${year}-${month}`;

    // 1. Caché vigente
    const cached = await this.readCache<CachedWeather>(cacheKey);
    if (cached) return cached;

    // 2. API externa (solo si hay credencial real)
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
    const hasKey = apiKey && apiKey !== 'your-openweather-key';
    if (hasKey) {
      try {
        const res = await axios.get<WeatherApiResponse>(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city},${countryCode}&appid=${apiKey}&units=metric&lang=es&cnt=5`,
          { timeout: 5000 },
        );
        const live: CachedWeather = {
          source: 'pronostico',
          isReferential: false,
          city: res.data.city.name,
          forecast: res.data.list.slice(0, 3).map((item: WeatherForecastItem) => ({
            description: item.weather[0].description,
            temp_min: Math.round(item.main.temp_min),
            temp_max: Math.round(item.main.temp_max),
          })),
        };
        await this.writeCache(cacheKey, live, TTL_WEATHER_MS);
        return live;
      } catch {
        // Continúa al respaldo
      }
    }

    // 3. Caché vencido (mejor que nada si la API falló)
    const stale = await this.readCache<CachedWeather>(cacheKey, true);
    if (stale) return { ...stale, isReferential: true };

    // 4. Dato de respaldo de la base
    return this.fallbackWeather(destinationId, city, dep);
  }

  /**
   * Devuelve los feriados del país entre las dos fechas.
   * Orden: caché vigente → Calendarific (si hay clave) → caché vencido → dato de respaldo.
   * `isReferential: true` cuando el dato no es de la API en tiempo real.
   */
  private async getHolidays(countryCode: string, dep: Date, ret: Date) {
    const year = dep.getUTCFullYear();
    const cacheKey = `holidays:${countryCode}:${year}`;

    // 1. Caché vigente
    const cached = await this.readCache<CachedHoliday[]>(cacheKey);
    if (cached) {
      // El caché guarda todos los feriados del año; filtramos por rango de fechas aquí.
      return this.filterHolidaysByRange(cached, dep, ret);
    }

    // 2. API externa (solo si hay credencial real)
    const apiKey = this.config.get<string>('CALENDARIFIC_API_KEY');
    const hasKey = apiKey && apiKey !== 'your-calendarific-key';
    if (hasKey) {
      try {
        const res = await axios.get<HolidayApiResponse>(
          `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${countryCode}&year=${year}`,
          { timeout: 5000 },
        );
        const allHolidays: CachedHoliday[] = res.data.response.holidays.map((h: HolidayItem) => ({
          name: h.name,
          date: h.date.iso.slice(0, 10),
          type: h.type[0],
          isReferential: false,
        }));
        await this.writeCache(cacheKey, allHolidays, TTL_HOLIDAYS_MS);
        return this.filterHolidaysByRange(allHolidays, dep, ret);
      } catch {
        // Continúa al respaldo
      }
    }

    // 3. Caché vencido
    const stale = await this.readCache<CachedHoliday[]>(cacheKey, true);
    if (stale) {
      const filtered = this.filterHolidaysByRange(stale, dep, ret);
      return filtered.map(h => ({ ...h, isReferential: true }));
    }

    // 4. Dato de respaldo de la base
    return this.fallbackHolidays(countryCode, dep, ret);
  }

  /** Filtra una lista de feriados (con campo `date` en YYYY-MM-DD) por el rango dep–ret. */
  private filterHolidaysByRange(holidays: CachedHoliday[], dep: Date, ret: Date) {
    return holidays.filter(h => {
      const d = new Date(`${h.date}T00:00:00Z`);
      return d >= dep && d <= ret;
    });
  }

  // ── Respaldos de base ───────────────────────────────────────────────────────

  /** Clima promedio del mes de salida, con la misma forma que la respuesta de OpenWeatherMap. */
  private async fallbackWeather(destinationId: number, city: string, dep: Date) {
    const climate = await this.prisma.destinationClimate.findUnique({
      where: { destinationId_month: { destinationId, month: dep.getUTCMonth() + 1 } },
    });
    if (!climate) return null;
    return {
      source: 'promedio',
      isReferential: true,
      city,
      forecast: [
        {
          description: climate.summary,
          temp_min: Math.round(Number(climate.minTempC)),
          temp_max: Math.round(Number(climate.maxTempC)),
        },
      ],
    };
  }

  /** Feriados de fecha fija del país entre la salida y el regreso (incluye viajes que cruzan de año). */
  private async fallbackHolidays(countryCode: string, dep: Date, ret: Date) {
    const rows = await this.prisma.holiday.findMany({ where: { countryCode } });
    const result: { name: string; date: string; type: string; isReferential: boolean }[] = [];
    for (let year = dep.getUTCFullYear(); year <= ret.getUTCFullYear(); year++) {
      for (const h of rows) {
        const date = new Date(Date.UTC(year, h.month - 1, h.day));
        if (date >= dep && date <= ret) {
          result.push({ name: h.name, date: date.toISOString().slice(0, 10), type: 'Feriado nacional', isReferential: true });
        }
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Administración de destinos (US-027) ────────────────────────────────────

  /** Lista todos los destinos (activos e inactivos) para el panel de administración. */
  async findAllAdmin() {
    return this.prisma.destination.findMany({ orderBy: { name: 'asc' } });
  }

  /** Crea un destino nuevo en el catálogo. */
  async createDestination(dto: CreateDestinationDto) {
    return this.prisma.destination.create({ data: dto });
  }

  /** Actualiza los campos de un destino existente. */
  async updateDestination(id: number, dto: UpdateDestinationDto) {
    await this.requireDestination(id);
    return this.prisma.destination.update({ where: { id }, data: dto });
  }

  /**
   * Desactiva un destino. Lanza BadRequestException si alguno de sus vuelos
   * está en una reserva activa (PENDIENTE, CONFIRMADO o EN_CURSO).
   */
  async deactivateDestination(id: number) {
    await this.requireDestination(id);
    await this.checkActiveBookingsForDestination(id);
    return this.prisma.destination.update({ where: { id }, data: { isActive: false } });
  }

  /** Agrega un vuelo a un destino. */
  async createFlight(destinationId: number, dto: CreateFlightDto) {
    await this.requireDestination(destinationId);
    const dep = new Date(dto.departureDate);
    const arr = new Date(dto.arrivalDate);
    if (arr <= dep) throw new BadRequestException('La fecha de llegada debe ser posterior a la de salida');
    return this.prisma.flight.create({
      data: {
        ...dto,
        destinationId,
        departureDate: dep,
        arrivalDate: arr,
        pricePerPerson: new Prisma.Decimal(dto.pricePerPerson),
      },
    });
  }

  /** Actualiza un vuelo. */
  async updateFlight(destinationId: number, flightId: number, dto: UpdateFlightDto) {
    await this.requireDestination(destinationId);
    await this.requireFlight(flightId, destinationId);
    const data: Prisma.FlightUpdateInput = { ...dto };
    if (dto.departureDate) data.departureDate = new Date(dto.departureDate);
    if (dto.arrivalDate) data.arrivalDate = new Date(dto.arrivalDate);
    if (dto.pricePerPerson) data.pricePerPerson = new Prisma.Decimal(dto.pricePerPerson);
    return this.prisma.flight.update({ where: { id: flightId }, data });
  }

  /** Desactiva un vuelo; falla si tiene reservas activas. */
  async deactivateFlight(destinationId: number, flightId: number) {
    await this.requireDestination(destinationId);
    await this.requireFlight(flightId, destinationId);
    const activa = await this.prisma.bookingFlight.findFirst({
      where: {
        flightId,
        booking: { status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      },
    });
    if (activa) throw new BadRequestException('No se puede desactivar porque ya forma parte de una reserva activa');
    return this.prisma.flight.update({ where: { id: flightId }, data: { isActive: false } });
  }

  /** Agrega un hotel a un destino. */
  async createHotel(destinationId: number, dto: CreateHotelDto) {
    await this.requireDestination(destinationId);
    return this.prisma.hotel.create({
      data: { ...dto, destinationId, pricePerNight: new Prisma.Decimal(dto.pricePerNight) },
    });
  }

  /** Actualiza un hotel. */
  async updateHotel(destinationId: number, hotelId: number, dto: UpdateHotelDto) {
    await this.requireDestination(destinationId);
    await this.requireHotel(hotelId, destinationId);
    const data: Prisma.HotelUpdateInput = { ...dto };
    if (dto.pricePerNight) data.pricePerNight = new Prisma.Decimal(dto.pricePerNight);
    return this.prisma.hotel.update({ where: { id: hotelId }, data });
  }

  /** Desactiva un hotel; falla si tiene reservas activas. */
  async deactivateHotel(destinationId: number, hotelId: number) {
    await this.requireDestination(destinationId);
    await this.requireHotel(hotelId, destinationId);
    const activa = await this.prisma.bookingHotel.findFirst({
      where: {
        hotelId,
        booking: { status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      },
    });
    if (activa) throw new BadRequestException('No se puede desactivar porque ya forma parte de una reserva activa');
    return this.prisma.hotel.update({ where: { id: hotelId }, data: { isActive: false } });
  }

  /** Agrega una actividad a un destino. */
  async createActivity(destinationId: number, dto: CreateActivityDto) {
    await this.requireDestination(destinationId);
    return this.prisma.activity.create({
      data: { ...dto, destinationId, price: new Prisma.Decimal(dto.price) },
    });
  }

  /** Actualiza una actividad. */
  async updateActivity(destinationId: number, activityId: number, dto: UpdateActivityDto) {
    await this.requireDestination(destinationId);
    await this.requireActivity(activityId, destinationId);
    const data: Prisma.ActivityUpdateInput = { ...dto };
    if (dto.price) data.price = new Prisma.Decimal(dto.price);
    return this.prisma.activity.update({ where: { id: activityId }, data });
  }

  /** Desactiva una actividad; falla si tiene reservas activas. */
  async deactivateActivity(destinationId: number, activityId: number) {
    await this.requireDestination(destinationId);
    await this.requireActivity(activityId, destinationId);
    const activa = await this.prisma.bookingActivity.findFirst({
      where: {
        activityId,
        booking: { status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      },
    });
    if (activa) throw new BadRequestException('No se puede desactivar porque ya forma parte de una reserva activa');
    return this.prisma.activity.update({ where: { id: activityId }, data: { isActive: false } });
  }

  /** Lista todos los extras del catálogo. */
  async findAllExtras() {
    return this.prisma.extraOption.findMany({ orderBy: { type: 'asc' } });
  }

  /** Crea un extra en el catálogo. */
  async createExtra(dto: CreateExtraDto) {
    return this.prisma.extraOption.create({
      data: { ...dto, price: new Prisma.Decimal(dto.price) },
    });
  }

  /** Actualiza un extra del catálogo. */
  async updateExtra(id: number, dto: UpdateExtraDto) {
    await this.requireExtra(id);
    const data: Prisma.ExtraOptionUpdateInput = { ...dto };
    if (dto.price) data.price = new Prisma.Decimal(dto.price);
    return this.prisma.extraOption.update({ where: { id }, data });
  }

  /** Desactiva un extra del catálogo. */
  async deactivateExtra(id: number) {
    await this.requireExtra(id);
    return this.prisma.extraOption.update({ where: { id }, data: { isActive: false } });
  }

  // ── Helpers de verificación ─────────────────────────────────────────────────

  /** Lanza NotFoundException si el destino no existe. */
  private async requireDestination(id: number) {
    const dest = await this.prisma.destination.findUnique({ where: { id } });
    if (!dest) throw new NotFoundException('Destino no encontrado');
    return dest;
  }

  /** Lanza NotFoundException si el vuelo no existe o no pertenece al destino. */
  private async requireFlight(id: number, destinationId: number) {
    const flight = await this.prisma.flight.findFirst({ where: { id, destinationId } });
    if (!flight) throw new NotFoundException('Vuelo no encontrado');
    return flight;
  }

  /** Lanza NotFoundException si el hotel no existe o no pertenece al destino. */
  private async requireHotel(id: number, destinationId: number) {
    const hotel = await this.prisma.hotel.findFirst({ where: { id, destinationId } });
    if (!hotel) throw new NotFoundException('Hotel no encontrado');
    return hotel;
  }

  /** Lanza NotFoundException si la actividad no existe o no pertenece al destino. */
  private async requireActivity(id: number, destinationId: number) {
    const activity = await this.prisma.activity.findFirst({ where: { id, destinationId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  /** Lanza NotFoundException si el extra no existe. */
  private async requireExtra(id: number) {
    const extra = await this.prisma.extraOption.findUnique({ where: { id } });
    if (!extra) throw new NotFoundException('Extra no encontrado');
    return extra;
  }

  /**
   * Verifica que ningún vuelo del destino esté en una reserva activa.
   * Se usa antes de desactivar el destino completo.
   */
  private async checkActiveBookingsForDestination(destinationId: number) {
    const activa = await this.prisma.bookingFlight.findFirst({
      where: {
        flight: { destinationId },
        booking: { status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      },
    });
    if (activa) throw new BadRequestException('No se puede desactivar porque ya forma parte de una reserva activa');
  }
}
