import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DAY = 86_400_000;
/** Días que cubre el pronóstico gratuito de OpenWeatherMap (5 días en bloques de 3 horas). */
const FORECAST_DAYS = 5;
/** Lo que se usa de cada bloque del pronóstico de OpenWeatherMap. */
type ForecastItem = { dt: number; weather: { description: string }[]; main: { temp_min: number; temp_max: number } };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * ¿La festividad cae dentro del viaje? (TS-019)
 * La festividad se guarda como día/mes y puede cruzar de año (ej. 20/12 al 06/01), igual que el viaje.
 * Se prueba en cada año que toca el viaje, empezando el anterior por si la festividad empezó en diciembre.
 */
export function festivityInTrip(
  f: { startMonth: number; startDay: number; endMonth: number; endDay: number },
  dep: Date,
  ret: Date,
): boolean {
  const crossesYear = f.endMonth < f.startMonth || (f.endMonth === f.startMonth && f.endDay < f.startDay);
  for (let year = dep.getUTCFullYear() - 1; year <= ret.getUTCFullYear(); year++) {
    const start = Date.UTC(year, f.startMonth - 1, f.startDay);
    const end = Date.UTC(crossesYear ? year + 1 : year, f.endMonth - 1, f.endDay);
    if (start <= ret.getTime() && end >= dep.getTime()) return true;
  }
  return false;
}

/** ¿El viaje empieza dentro de la ventana que cubre el pronóstico? (TS-019) */
export function isWithinForecast(dep: Date, now = Date.now()): boolean {
  return dep.getTime() < now + FORECAST_DAYS * DAY;
}

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
    return this.prisma.destination.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        hotels: { where: { isActive: true }, orderBy: { stars: 'desc' } },
        activities: { where: { isActive: true }, orderBy: { type: 'asc' } },
        festivities: { where: { isActive: true } },
        departingFlights: { where: { isActive: true }, orderBy: { pricePerPerson: 'asc' } },
      },
    });
    if (!destination) throw new NotFoundException('Destino no encontrado');
    return destination;
  }

  async getContext(id: number, departureDate: string, returnDate: string) {
    const destination = await this.findOne(id);
    const dep = new Date(departureDate);
    const ret = new Date(returnDate);

    // Festividades que coinciden con las fechas del viaje, también si cruzan de año (TS-019).
    const matchingFestivities = destination.festivities.filter(f => festivityInTrip(f, dep, ret));

    // Clima (TS-019): pronóstico real solo si el viaje empieza dentro de la ventana del pronóstico;
    // si no, el clima promedio del destino en el mes del viaje.
    const nearTrip = isWithinForecast(dep);
    let weather = null;
    if (nearTrip) {
      try {
        const apiKey = this.config.get('OPENWEATHER_API_KEY');
        if (apiKey && apiKey !== 'your-openweather-key') {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${destination.city},${destination.countryCode}&appid=${apiKey}&units=metric&lang=es`
          );
          // Solo los bloques que caen entre la salida y el regreso, no los de hoy.
          const list: ForecastItem[] = res.data.list;
          const items = list.filter((item) => {
            const t = item.dt * 1000;
            return t >= dep.getTime() && t < ret.getTime() + DAY;
          });
          if (items.length) {
            weather = {
              source: 'pronostico',
              label: 'Pronóstico para tus fechas',
              city: res.data.city.name,
              forecast: items.slice(0, 3).map((item) => ({
                description: item.weather[0].description,
                temp_min: Math.round(item.main.temp_min),
                temp_max: Math.round(item.main.temp_max),
              })),
            };
          }
        }
      } catch { weather = null; }
    }

    // Viaje lejano, o pronóstico no disponible: clima promedio del mes guardado en la base.
    if (!weather) weather = await this.fallbackWeather(destination.id, destination.city, dep, nearTrip);

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

  /**
   * Clima promedio del mes de salida, con la misma forma que la respuesta de OpenWeatherMap.
   * Viaje lejano: "Clima promedio de [mes]". Viaje cercano sin pronóstico: además, "Dato referencial".
   */
  private async fallbackWeather(destinationId: number, city: string, dep: Date, nearTrip = false) {
    const month = dep.getUTCMonth() + 1;
    const climate = await this.prisma.destinationClimate.findUnique({
      where: { destinationId_month: { destinationId, month } },
    });
    if (!climate) return null;
    const label = `Clima promedio de ${MESES[month - 1]}`;
    return {
      source: 'promedio',
      label: nearTrip ? `Dato referencial · ${label}` : label,
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
