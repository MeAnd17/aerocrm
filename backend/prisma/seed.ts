/**
 * Carga de arranque de AeroCRM (TS-005, TS-014).
 *
 * Idempotente (AGENTS.md D5): ejecutarla dos veces deja lo mismo que ejecutarla una vez.
 * Cada registro se busca por su clave natural y se actualiza o se crea; nunca se duplica.
 * Las fechas se calculan desde SEED_REFERENCE_DATE (AAAA-MM-DD) o, si está vacía, desde hoy.
 *
 *   npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  computeRedemption,
  fromCents,
  levelForTrips,
  pointsForPurchase,
  toCents,
} from '../src/loyalty/loyalty.rules';
import { ACTIVITIES, DESTINATIONS, FESTIVITIES, HOTELS } from './seed-data/catalog';
import { CLASS_FACTOR, ROUTES, buildFlights } from './seed-data/flights';
import { HISTORY, HistoryTrip } from './seed-data/history';
import { AGENCY, CLIMATE, EXTRAS, HOLIDAYS, climateSummary } from './seed-data/reference';
import { DEMO_CLIENTS, DEMO_PASSWORD } from './seed-data/users';

const prisma = new PrismaClient();

// ── Fechas ────────────────────────────────────────────────────────────────────

export function referenceDate(): Date {
  const raw = process.env.SEED_REFERENCE_DATE?.trim();
  const base = raw ? new Date(`${raw}T00:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new Error(`SEED_REFERENCE_DATE inválida: "${raw}". Usa el formato AAAA-MM-DD.`);
  }
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
}

function atDay(ref: Date, dayOffset: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(ref);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

// ── Secciones ─────────────────────────────────────────────────────────────────

async function seedDestinations(): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  for (const d of DESTINATIONS) {
    const row = await prisma.destination.upsert({
      where: { iataCode: d.iataCode },
      update: { ...d, isActive: true },
      create: d,
    });
    ids.set(d.iataCode, row.id);
  }
  return ids;
}

function destinationId(ids: Map<string, number>, iata: string): number {
  const id = ids.get(iata);
  if (!id) throw new Error(`Destino ${iata} no existe en la carga de arranque`);
  return id;
}

async function seedHotels(ids: Map<string, number>) {
  for (const { iata, ...h } of HOTELS) {
    const data = { ...h, destinationId: destinationId(ids, iata), currency: 'PEN', isActive: true };
    const found = await prisma.hotel.findFirst({ where: { destinationId: data.destinationId, name: h.name }, select: { id: true } });
    if (found) await prisma.hotel.update({ where: { id: found.id }, data });
    else await prisma.hotel.create({ data });
  }
}

async function seedActivities(ids: Map<string, number>) {
  for (const { iata, ...a } of ACTIVITIES) {
    const data = { ...a, destinationId: destinationId(ids, iata), currency: 'PEN', isActive: true };
    const found = await prisma.activity.findFirst({ where: { destinationId: data.destinationId, name: a.name }, select: { id: true } });
    if (found) await prisma.activity.update({ where: { id: found.id }, data });
    else await prisma.activity.create({ data });
  }
}

async function seedFestivities(ids: Map<string, number>) {
  for (const { iata, ...f } of FESTIVITIES) {
    const data = { ...f, destinationId: destinationId(ids, iata), isActive: true };
    // La clave es el nombre: si una festividad estaba asignada a otro destino, se corrige.
    const found = await prisma.festivity.findFirst({ where: { name: f.name }, select: { id: true } });
    if (found) await prisma.festivity.update({ where: { id: found.id }, data });
    else await prisma.festivity.create({ data });
  }
}

async function seedFlights(ids: Map<string, number>, ref: Date): Promise<Map<string, number>> {
  const flights = buildFlights();
  const existing = await prisma.flight.findMany({
    where: { flightNumber: { in: flights.map((f) => f.flightNumber) } },
    select: { id: true, flightNumber: true },
  });
  const byNumber = new Map<string, number>(existing.map((f) => [f.flightNumber, f.id]));

  for (const f of flights) {
    const departureDate = atDay(ref, f.dayOffset, f.departureUtc);
    const data = {
      originId: destinationId(ids, f.from),
      destinationId: destinationId(ids, f.to),
      airline: f.airline,
      flightNumber: f.flightNumber,
      departureDate,
      arrivalDate: addMinutes(departureDate, f.durationMinutes),
      durationMinutes: f.durationMinutes,
      stops: f.stops,
      classType: f.classType,
      pricePerPerson: f.pricePerPerson,
      currency: 'PEN',
      seatsAvailable: f.seatsAvailable,
      isActive: true,
    };
    const id = byNumber.get(f.flightNumber);
    if (id) await prisma.flight.update({ where: { id }, data });
    else byNumber.set(f.flightNumber, (await prisma.flight.create({ data, select: { id: true } })).id);
  }
  return byNumber;
}

async function seedDemoClients(): Promise<Map<string, { userId: number; clientId: number }>> {
  const result = new Map<string, { userId: number; clientId: number }>();
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const c of DEMO_CLIENTS) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { password, firstName: c.firstName, lastName: c.lastName, isActive: true },
      create: { email: c.email, password, firstName: c.firstName, lastName: c.lastName },
    });
    const profile = {
      phone: c.phone,
      nationality: 'PE',
      dateOfBirth: new Date(`${c.dateOfBirth}T00:00:00Z`),
      documentNumber: c.documentNumber,
      travelStyle: c.travelStyle,
      destinationType: c.destinationType,
      budget: c.budget,
    };
    const client = await prisma.client.upsert({
      where: { userId: user.id },
      update: profile,
      create: { userId: user.id, ...profile },
    });
    result.set(c.key, { userId: user.id, clientId: client.id });
  }
  return result;
}

async function seedReferenceData(ids: Map<string, number>) {
  for (const e of EXTRAS) {
    await prisma.extraOption.upsert({ where: { type: e.type }, update: { ...e, isActive: true }, create: e });
  }
  await prisma.agencyInfo.upsert({ where: { id: 1 }, update: AGENCY, create: { id: 1, ...AGENCY } });

  for (const [iata, series] of Object.entries(CLIMATE)) {
    const destId = destinationId(ids, iata);
    for (let m = 0; m < 12; m++) {
      const avg = series.avg[m];
      const data = {
        avgTempC: avg,
        minTempC: avg - series.spread,
        maxTempC: avg + series.spread,
        rainyDays: series.rainyDays[m],
        summary: climateSummary(avg, series.rainyDays[m]),
      };
      await prisma.destinationClimate.upsert({
        where: { destinationId_month: { destinationId: destId, month: m + 1 } },
        update: data,
        create: { destinationId: destId, month: m + 1, ...data },
      });
    }
  }

  for (const h of HOLIDAYS) {
    await prisma.holiday.upsert({
      where: { countryCode_month_day: { countryCode: h.countryCode, month: h.month, day: h.day } },
      update: { name: h.name },
      create: h,
    });
  }
}

/**
 * Historial de compras de los clientes de demostración.
 * Se reconstruye completo en cada ejecución: se borran sus reservas e historial de puntos
 * y se vuelven a crear. Los saldos se calculan con el motor de fidelización, así siempre cuadran.
 */
async function seedHistory(
  ids: Map<string, number>,
  ref: Date,
  clients: Map<string, { userId: number; clientId: number }>,
) {
  const counters = new Map<string, number>();
  const historyFlight = async (from: string, to: string, iata: string, dayOffset: number, trip: HistoryTrip) => {
    const route = ROUTES.find((r) => r.to === iata);
    if (!route) throw new Error(`No hay ruta para ${iata}`);
    const carrier = route.carriers[0];
    const n = (counters.get(carrier.code) ?? 9000) + 1;
    counters.set(carrier.code, n);
    const flightNumber = `${carrier.code}${n}`;
    const departureDate = atDay(ref, dayOffset, '08:30');
    const price = Math.round(route.basePrice * CLASS_FACTOR[trip.classType]);
    const data = {
      originId: destinationId(ids, from),
      destinationId: destinationId(ids, to),
      airline: carrier.name,
      flightNumber,
      departureDate,
      arrivalDate: addMinutes(departureDate, route.directMinutes),
      durationMinutes: route.directMinutes,
      stops: carrier.stops,
      classType: trip.classType,
      pricePerPerson: price,
      currency: 'PEN',
      seatsAvailable: 0,
      isActive: true,
    };
    const found = await prisma.flight.findFirst({ where: { flightNumber }, select: { id: true } });
    const id = found
      ? (await prisma.flight.update({ where: { id: found.id }, data, select: { id: true } })).id
      : (await prisma.flight.create({ data, select: { id: true } })).id;
    return { id, priceCents: toCents(price) };
  };

  for (const [key, trips] of Object.entries(HISTORY)) {
    const owner = clients.get(key);
    if (!owner) throw new Error(`Cliente de demostración "${key}" no existe`);

    await prisma.booking.deleteMany({ where: { clientId: owner.clientId } });
    await prisma.pointsHistory.deleteMany({ where: { clientId: owner.clientId } });

    let totalPoints = 0;
    let availablePoints = 0;
    let completedTrips = 0;

    for (const [index, trip] of trips.entries()) {
      const destId = destinationId(ids, trip.iata);
      const outbound = await historyFlight('LIM', trip.iata, trip.iata, trip.dayOffset, trip);
      const inbound = await historyFlight(trip.iata, 'LIM', trip.iata, trip.dayOffset + trip.nights, trip);

      const hotel = await prisma.hotel.findFirst({ where: { destinationId: destId, name: trip.hotel } });
      if (!hotel) throw new Error(`Hotel "${trip.hotel}" no existe en ${trip.iata}`);
      const activities = await prisma.activity.findMany({ where: { destinationId: destId, name: { in: trip.activities } } });
      if (activities.length !== trip.activities.length) throw new Error(`Actividades de ${trip.iata} no encontradas`);
      const extras = await prisma.extraOption.findMany({ where: { type: { in: trip.extras } } });

      const pax = trip.passengers;
      const flightCents = (outbound.priceCents + inbound.priceCents) * pax;
      const hotelCents = toCents(hotel.pricePerNight) * trip.nights;
      const activityCents = activities.reduce((sum, a) => sum + toCents(a.price) * pax, 0);
      const extraCents = extras.map((e) => toCents(e.price) * (e.pricing === 'POR_PASAJERO' ? pax : 1));
      const packageTotalCents = flightCents + hotelCents + activityCents + extraCents.reduce((a, b) => a + b, 0);

      const redemption = computeRedemption({
        packageTotalCents,
        pointsToRedeem: trip.redeemPoints ?? 0,
        availablePoints,
        completedTrips,
      });
      const earnsPoints = trip.status !== 'CANCELADO';
      const pointsEarned = earnsPoints ? pointsForPurchase(redemption.finalTotalCents) : 0;
      const purchasedAt = atDay(ref, trip.dayOffset - 30, '15:00');
      const checkIn = atDay(ref, trip.dayOffset, '15:00');
      const code = `VJ-${key.slice(0, 2).toUpperCase()}${String(index + 1).padStart(4, '0')}`;

      const booking = await prisma.booking.create({
        data: {
          confirmationCode: code,
          userId: owner.userId,
          clientId: owner.clientId,
          status: trip.status,
          totalPrice: fromCents(redemption.finalTotalCents),
          discountAmount: fromCents(redemption.totalDiscountCents),
          pointsEarned,
          pointsUsed: redemption.pointsUsed,
          passengers: pax,
          createdAt: purchasedAt,
          bookingFlights: {
            create: [
              { flightId: outbound.id, priceSnapshot: fromCents(outbound.priceCents * pax) },
              { flightId: inbound.id, priceSnapshot: fromCents(inbound.priceCents * pax) },
            ],
          },
          bookingHotels: {
            create: [{ hotelId: hotel.id, checkIn, checkOut: atDay(ref, trip.dayOffset + trip.nights, '11:00'), nights: trip.nights, priceSnapshot: fromCents(hotelCents) }],
          },
          bookingActivities: {
            create: activities.map((a) => ({ activityId: a.id, quantity: pax, priceSnapshot: fromCents(toCents(a.price) * pax) })),
          },
          bookingExtras: {
            create: extras.map((e, i) => ({ type: e.type, price: fromCents(extraCents[i]) })),
          },
        },
      });

      if (redemption.pointsUsed > 0) {
        availablePoints -= redemption.pointsUsed;
        await prisma.pointsHistory.create({
          data: { clientId: owner.clientId, type: 'REDEEMED', points: -redemption.pointsUsed, description: `Canje en paquete ${code}`, bookingId: booking.id, createdAt: purchasedAt },
        });
      }
      if (pointsEarned > 0) {
        totalPoints += pointsEarned;
        availablePoints += pointsEarned;
        await prisma.pointsHistory.create({
          data: { clientId: owner.clientId, type: 'EARNED', points: pointsEarned, description: `Compra de paquete ${code}`, bookingId: booking.id, createdAt: purchasedAt },
        });
      }
      if (trip.status === 'COMPLETADO') completedTrips += 1;
    }

    await prisma.client.update({
      where: { id: owner.clientId },
      data: { totalPoints, availablePoints, completedTrips, membershipLevel: levelForTrips(completedTrips).level },
    });
  }

  // Destinos guardados del cliente intermedio (para el inicio personalizado).
  const viajero = clients.get('viajero');
  if (viajero) {
    for (const iata of ['SVQ', 'PTY']) {
      const destId = destinationId(ids, iata);
      await prisma.savedDestination.upsert({
        where: { clientId_destinationId: { clientId: viajero.clientId, destinationId: destId } },
        update: {},
        create: { clientId: viajero.clientId, destinationId: destId },
      });
    }
  }
}

// ── Principal ─────────────────────────────────────────────────────────────────

async function main() {
  const ref = referenceDate();
  console.log(`Carga de arranque · fecha de referencia ${ref.toISOString().slice(0, 10)}`);

  const ids = await seedDestinations();
  await seedHotels(ids);
  await seedActivities(ids);
  await seedFestivities(ids);
  await seedFlights(ids, ref);
  await seedReferenceData(ids);
  const clients = await seedDemoClients();
  await seedHistory(ids, ref, clients);

  const counts = {
    destinos: await prisma.destination.count(),
    vuelos: await prisma.flight.count(),
    hoteles: await prisma.hotel.count(),
    actividades: await prisma.activity.count(),
    festividades: await prisma.festivity.count(),
    usuarios: await prisma.user.count(),
    reservas: await prisma.booking.count(),
    movimientosDePuntos: await prisma.pointsHistory.count(),
    extras: await prisma.extraOption.count(),
    climaMensual: await prisma.destinationClimate.count(),
    feriados: await prisma.holiday.count(),
  };
  console.log('Registros:', JSON.stringify(counts));
  console.log(`Credenciales de demostración (contraseña ${DEMO_PASSWORD}):`);
  for (const c of DEMO_CLIENTS) {
    const client = await prisma.client.findFirst({ where: { user: { email: c.email } } });
    console.log(`  ${c.email.padEnd(26)} ${client?.membershipLevel} · ${client?.completedTrips} viajes · ${client?.availablePoints} puntos`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
