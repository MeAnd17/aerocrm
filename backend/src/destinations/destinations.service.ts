import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async findAll(query: any) {
    const { type, search } = query;
    const where: any = { isActive: true };
    if (type) where.type = type;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
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

    // Clima via OpenWeatherMap
    let weather = null;
    try {
      const apiKey = this.config.get('OPENWEATHER_API_KEY');
      if (apiKey && apiKey !== 'your-openweather-key') {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${destination.city},${destination.countryCode}&appid=${apiKey}&units=metric&lang=es&cnt=5`
        );
        weather = {
          source: 'pronostico',
          city: res.data.city.name,
          forecast: res.data.list.slice(0, 3).map((item: any) => ({
            description: item.weather[0].description,
            temp_min: Math.round(item.main.temp_min),
            temp_max: Math.round(item.main.temp_max),
          })),
        };
      }
    } catch { weather = null; }

    // Respaldo (M7): sin API o si falla, clima promedio del mes guardado en la base.
    if (!weather) weather = await this.fallbackWeather(destination.id, destination.city, dep);

    // Feriados via Calendarific
    let holidays = [];
    try {
      const apiKey = this.config.get('CALENDARIFIC_API_KEY');
      if (apiKey && apiKey !== 'your-calendarific-key') {
        const year = dep.getFullYear();
        const res = await axios.get(
          `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${destination.countryCode}&year=${year}`
        );
        holidays = res.data.response.holidays.filter((h: any) => {
          const hDate = new Date(h.date.iso);
          return hDate >= dep && hDate <= ret;
        }).map((h: any) => ({ name: h.name, date: h.date.iso, type: h.type[0] }));
      }
    } catch { holidays = []; }

    // Respaldo (M7): feriados nacionales de fecha fija guardados en la base.
    if (!holidays.length) holidays = await this.fallbackHolidays(destination.countryCode, dep, ret);

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

  /** Clima promedio del mes de salida, con la misma forma que la respuesta de OpenWeatherMap. */
  private async fallbackWeather(destinationId: number, city: string, dep: Date) {
    const climate = await this.prisma.destinationClimate.findUnique({
      where: { destinationId_month: { destinationId, month: dep.getUTCMonth() + 1 } },
    });
    if (!climate) return null;
    return {
      source: 'promedio',
      city,
      forecast: [
        {
          description: `${climate.summary} (promedio del mes)`,
          temp_min: Math.round(Number(climate.minTempC)),
          temp_max: Math.round(Number(climate.maxTempC)),
        },
      ],
    };
  }

  /** Feriados de fecha fija del país entre la salida y el regreso (incluye viajes que cruzan de año). */
  private async fallbackHolidays(countryCode: string, dep: Date, ret: Date) {
    const rows = await this.prisma.holiday.findMany({ where: { countryCode } });
    const result: { name: string; date: string; type: string }[] = [];
    for (let year = dep.getUTCFullYear(); year <= ret.getUTCFullYear(); year++) {
      for (const h of rows) {
        const date = new Date(Date.UTC(year, h.month - 1, h.day));
        if (date >= dep && date <= ret) {
          result.push({ name: h.name, date: date.toISOString().slice(0, 10), type: 'Feriado nacional' });
        }
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}
