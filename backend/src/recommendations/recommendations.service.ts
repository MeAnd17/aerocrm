import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsRequestDto } from './dto/recommendations-request.dto';

/** Traduce el enum DestinationType al español para los mensajes de razón. */
function tipoEnEspanol(type: string): string {
  const MAP: Record<string, string> = {
    PLAYA: 'Playa',
    CIUDAD: 'Ciudad',
    AVENTURA: 'Aventura',
    CULTURA: 'Cultura',
  };
  return MAP[type] ?? type;
}

interface Recommendation {
  destination: Record<string, unknown>;
  reason: string;
  isReturn: boolean;
}

export { Recommendation };

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(
    clientId: number | null,
    dto: RecommendationsRequestDto,
  ): Promise<Recommendation[]> {
    const { viewedDestinationTypes, priceRangeFilter } = dto.searchSignals;

    // Cargar todos los destinos activos ordenados por id (determinismo).
    const allDestinations = await this.prisma.destination.findMany({
      where: { isActive: true },
      include: { festivities: { where: { isActive: true } } },
      orderBy: { id: 'asc' },
    });

    const recommendations: Recommendation[] = [];
    const usedIds = new Set<number>();

    const add = (dest: (typeof allDestinations)[number], reason: string, isReturn = false) => {
      if (usedIds.has(dest.id)) return;
      if (!reason) return;
      usedIds.add(dest.id);
      recommendations.push({
        destination: {
          id: dest.id,
          name: dest.name,
          country: dest.country,
          countryCode: dest.countryCode,
          city: dest.city,
          iataCode: dest.iataCode,
          description: dest.description,
          imageUrl: dest.imageUrl,
          type: dest.type,
          isActive: dest.isActive,
        },
        reason,
        isReturn,
      });
    };

    if (clientId) {
      // ── Con historial ──────────────────────────────────────────────────────
      const completedBookings = await this.prisma.booking.findMany({
        where: { clientId, status: 'COMPLETADO' },
        include: {
          bookingFlights: {
            include: {
              flight: { include: { destination: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (completedBookings.length > 0) {
        // Recopilar países, tipos y destinos ya visitados.
        const visitedCountries = new Map<string, Date>(); // country → fecha más reciente
        const visitedTypes = new Map<string, number>(); // type → cantidad
        const visitedDestIds = new Set<number>();

        for (const booking of completedBookings) {
          const destFlight = booking.bookingFlights.find((bf) =>
            bf.flight.destinationId !== null,
          );
          if (!destFlight) continue;
          const dest = destFlight.flight.destination;
          visitedDestIds.add(dest.id);

          // País más reciente
          if (!visitedCountries.has(dest.country) || booking.createdAt > visitedCountries.get(dest.country)!) {
            visitedCountries.set(dest.country, booking.createdAt);
          }

          // Contar tipos
          visitedTypes.set(dest.type, (visitedTypes.get(dest.type) ?? 0) + 1);
        }

        // Regla 6: Destinos ya visitados con isReturn = true
        for (const dest of allDestinations) {
          if (visitedDestIds.has(dest.id)) {
            add(dest, `Vuelve a ${dest.city}`, true);
          }
          if (recommendations.length >= 6) break;
        }

        // Regla 4: Destinos del mismo país/tipo
        const now = new Date();
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        for (const [country, date] of Array.from(visitedCountries.entries()).sort(([, a], [, b]) => b.getTime() - a.getTime())) {
          if (recommendations.length >= 6) break;
          const wasLastYear = date >= lastYear;
          const reason = wasLastYear
            ? `Porque viajaste a ${country} el año pasado`
            : `Porque viajaste a ${country}`;

          for (const dest of allDestinations) {
            if (recommendations.length >= 6) break;
            if (dest.country === country && !visitedDestIds.has(dest.id)) {
              add(dest, reason);
            }
          }
        }

        // Regla 5: Destinos del tipo más comprado
        if (recommendations.length < 6) {
          const topType = Array.from(visitedTypes.entries())
            .sort(([, a], [, b]) => b - a)[0]?.[0];

          if (topType) {
            for (const dest of allDestinations) {
              if (recommendations.length >= 6) break;
              if (dest.type === topType) {
                add(dest, `Porque sueles viajar en ${tipoEnEspanol(topType)}`);
              }
            }
          }
        }
      }
    }

    // ── Sin historial o para completar hasta 6 ─────────────────────────────
    // Regla 1: destinos del mismo tipo que viewedDestinationTypes
    if (recommendations.length < 6 && viewedDestinationTypes.length > 0) {
      for (const type of viewedDestinationTypes) {
        for (const dest of allDestinations) {
          if (recommendations.length >= 6) break;
          if (dest.type === type) {
            add(dest, `Porque buscaste ${tipoEnEspanol(type)}`);
          }
        }
        if (recommendations.length >= 6) break;
      }
    }

    // Regla 2: destinos con vuelos en el rango de precio
    if (recommendations.length < 6 && priceRangeFilter) {
      const flightsInRange = await this.prisma.flight.findMany({
        where: {
          isActive: true,
          pricePerPerson: {
            gte: priceRangeFilter.min,
            lte: priceRangeFilter.max,
          },
        },
        select: { destinationId: true },
        distinct: ['destinationId'],
      });
      const destIdsInRange = new Set(flightsInRange.map((f) => f.destinationId));

      for (const dest of allDestinations) {
        if (recommendations.length >= 6) break;
        if (destIdsInRange.has(dest.id)) {
          add(dest, 'Dentro de tu presupuesto habitual');
        }
      }
    }

    // Regla 3: destinos con festividades activas en los próximos 3 meses
    if (recommendations.length < 6) {
      const now = new Date();
      const upcomingMonths = new Set<number>();
      for (let i = 0; i <= 3; i++) {
        const m = ((now.getMonth() + i) % 12) + 1;
        upcomingMonths.add(m);
      }

      for (const dest of allDestinations) {
        if (recommendations.length >= 6) break;
        const festIncoming = dest.festivities.find((f) => upcomingMonths.has(f.startMonth));
        if (festIncoming) {
          add(dest, `Popular en ${festIncoming.name}`);
        }
      }
    }

    return recommendations;
  }

  /** Arma un draft de paquete con el vuelo más barato y el hotel de más estrellas. */
  async quickPackage(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) throw new BadRequestException('Destino no encontrado');

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Vuelo activo más barato al destino en el próximo mes
    const flight = await this.prisma.flight.findFirst({
      where: {
        destinationId,
        isActive: true,
        departureDate: {
          gte: now,
          lte: in30Days,
        },
      },
      orderBy: [{ pricePerPerson: 'asc' }, { id: 'asc' }],
    });

    if (!flight) {
      throw new BadRequestException(
        `Por ahora no tenemos vuelos disponibles a ${destination.name}`,
      );
    }

    // Hotel activo con más estrellas (menor precio si empatan)
    const hotel = await this.prisma.hotel.findFirst({
      where: { destinationId, isActive: true },
      orderBy: [{ stars: 'desc' }, { pricePerNight: 'asc' }, { id: 'asc' }],
    });

    // Hasta 2 actividades activas ordenadas por tipo
    const activities = await this.prisma.activity.findMany({
      where: { destinationId, isActive: true },
      orderBy: [{ type: 'asc' }, { id: 'asc' }],
      take: 2,
    });

    const departureDate = flight.departureDate.toISOString().slice(0, 10);

    return {
      destinationId,
      flightId: flight.id,
      hotelId: hotel?.id ?? null,
      activityIds: activities.map((a) => a.id),
      departureDate,
    };
  }
}
