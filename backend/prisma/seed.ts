/**
 * Carga de arranque de AeroCRM (TS-005).
 *
 * Idempotente (AGENTS.md D5): ejecutarla dos veces deja lo mismo que ejecutarla una vez.
 * Cada registro se busca por su clave natural y se actualiza o se crea; nunca se duplica.
 * Las fechas se calculan desde SEED_REFERENCE_DATE (AAAA-MM-DD) o, si está vacía, desde hoy.
 *
 *   npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ACTIVITIES, DESTINATIONS, FESTIVITIES, HOTELS } from './seed-data/catalog';
import { buildFlights } from './seed-data/flights';
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
  const byNumber = new Map(existing.map((f) => [f.flightNumber, f.id]));

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

async function seedDemoClients() {
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
    };
    await prisma.client.upsert({
      where: { userId: user.id },
      update: profile,
      create: { userId: user.id, ...profile },
    });
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
  await seedDemoClients();

  const counts = {
    destinos: await prisma.destination.count(),
    vuelos: await prisma.flight.count(),
    hoteles: await prisma.hotel.count(),
    actividades: await prisma.activity.count(),
    festividades: await prisma.festivity.count(),
    usuarios: await prisma.user.count(),
  };
  console.log('Registros:', JSON.stringify(counts));
  console.log(`Credenciales de demostración (contraseña ${DEMO_PASSWORD}):`);
  for (const c of DEMO_CLIENTS) console.log(`  ${c.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
