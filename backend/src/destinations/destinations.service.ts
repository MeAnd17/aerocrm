import { Injectable, NotFoundException } from '@nestjs/common';
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

    // Festividades que coinciden con las fechas del viaje
    const matchingFestivities = destination.festivities.filter(f => {
      const festStart = new Date(dep.getFullYear(), f.startMonth - 1, f.startDay);
      const festEnd = new Date(dep.getFullYear(), f.endMonth - 1, f.endDay);
      return festStart <= ret && festEnd >= dep;
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
          city: res.data.city.name,
          forecast: res.data.list.slice(0, 3).map((item: any) => ({
            description: item.weather[0].description,
            temp_min: Math.round(item.main.temp_min),
            temp_max: Math.round(item.main.temp_max),
          })),
        };
      }
    } catch { weather = null; }

    // Feriados via Calendarific
    let holidays = [];
    try {
      const apiKey = this.config.get('CALENDARIFIC_API_KEY');
      if (apiKey && apiKey !== 'your-calendarific-key') {
        const year = dep.getFullYear();
        const res = await axios.get(
          `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${destination.countryCode}&year=${year}`
        );
        const month = dep.getMonth() + 1;
        holidays = res.data.response.holidays.filter((h: any) => {
          const hDate = new Date(h.date.iso);
          return hDate >= dep && hDate <= ret;
        }).map((h: any) => ({ name: h.name, date: h.date.iso, type: h.type[0] }));
      }
    } catch { holidays = []; }

    return {
      destination,
      festivities: matchingFestivities,
      weather,
      holidays,
      hotels: destination.hotels,
      activities: destination.activities,
    };
  }

  async searchFlights(originIata: string, destinationId: number, departureDate: string, passengers: number) {
    const destination = await this.prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) throw new NotFoundException('Destino no encontrado');

    const origin = await this.prisma.destination.findFirst({ where: { iataCode: originIata } });

    const dep = new Date(departureDate);
    const nextDay = new Date(dep);
    nextDay.setDate(nextDay.getDate() + 1);

    const flights = await this.prisma.flight.findMany({
      where: {
        destinationId,
        ...(origin ? { originId: origin.id } : {}),
        departureDate: { gte: dep, lt: nextDay },
        seatsAvailable: { gte: passengers },
        isActive: true,
      },
      include: { origin: true, destination: true },
      orderBy: { pricePerPerson: 'asc' },
    });

    return flights.map(f => ({
      ...f,
      totalPrice: Number(f.pricePerPerson) * passengers,
    }));
  }
}
