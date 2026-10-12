/**
 * Motor único de fidelización (TS-012, AGENTS.md B7 y §12).
 *
 * Todas las reglas de puntos, niveles y canje viven aquí y en ningún otro lugar,
 * ni en otro servicio ni en el frontend. Funciones puras: no tocan la base, no dependen de Nest.
 * El dinero se maneja en céntimos enteros (AGENTS.md B5).
 */

export type MembershipLevelCode = 'EXPLORADOR' | 'VIAJERO' | 'FRECUENTE' | 'ELITE';

export interface LevelRule {
  level: MembershipLevelCode;
  label: string;
  minTrips: number;
  /** Descuento adicional sobre el total del paquete cuando el cliente canjea puntos. */
  redeemDiscountPercent: number;
}

/** Soles que hay que pagar para ganar un punto. */
export const SOLES_PER_POINT = 100;
/** Puntos mínimos para canjear. */
export const MIN_REDEEM_POINTS = 500;
/** Valor de un punto al canjear, en céntimos (500 puntos = S/ 50.00). */
export const POINT_VALUE_CENTS = 10;

/** Ordenados de menor a mayor. */
export const LEVELS: readonly LevelRule[] = [
  { level: 'EXPLORADOR', label: 'Explorador', minTrips: 0, redeemDiscountPercent: 0 },
  { level: 'VIAJERO', label: 'Viajero', minTrips: 3, redeemDiscountPercent: 5 },
  { level: 'FRECUENTE', label: 'Frecuente', minTrips: 8, redeemDiscountPercent: 10 },
  { level: 'ELITE', label: 'Elite', minTrips: 15, redeemDiscountPercent: 15 },
] as const;

export class RedemptionError extends Error {}

// ── Conversión de dinero ──────────────────────────────────────────────────────

/**
 * Convierte un monto (Decimal de Prisma, string o number) a céntimos enteros
 * sin pasar por aritmética de coma flotante.
 */
export function toCents(amount: { toString(): string } | string | number): number {
  const text = typeof amount === 'number' ? amount.toFixed(2) : amount.toString();
  const match = /^(-)?(\d+)(?:\.(\d{1,}))?$/.exec(text.trim());
  if (!match) throw new Error(`Monto inválido: ${text}`);
  const [, sign, soles, decimals = ''] = match;
  const twoDecimals = (decimals + '00').slice(0, 2);
  const roundUp = decimals.length > 2 && Number(decimals[2]) >= 5 ? 1 : 0;
  const cents = Number(soles) * 100 + Number(twoDecimals) + roundUp;
  return sign ? -cents : cents;
}

/** Convierte céntimos a string con dos decimales, apto para `Prisma.Decimal`. */
export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

// ── Puntos ────────────────────────────────────────────────────────────────────

/** Puntos que otorga una compra: 1 por cada S/ 100 del total pagado, redondeado hacia abajo. */
export function pointsForPurchase(totalPaidCents: number): number {
  if (totalPaidCents <= 0) return 0;
  return Math.floor(totalPaidCents / (SOLES_PER_POINT * 100));
}

/** Valor en céntimos de una cantidad de puntos. */
export function pointsValueCents(points: number): number {
  return Math.max(0, points) * POINT_VALUE_CENTS;
}

// ── Niveles ───────────────────────────────────────────────────────────────────

export function levelForTrips(completedTrips: number): LevelRule {
  const trips = Math.max(0, completedTrips);
  let current = LEVELS[0];
  for (const rule of LEVELS) {
    if (trips >= rule.minTrips) current = rule;
  }
  return current;
}

export interface LevelStatus {
  current: LevelRule;
  next: (LevelRule & { tripsNeeded: number; progressPercent: number }) | null;
}

/** Nivel actual, siguiente nivel y avance hacia él (0–100). */
export function levelStatus(completedTrips: number): LevelStatus {
  const trips = Math.max(0, completedTrips);
  const current = levelForTrips(trips);
  const index = LEVELS.indexOf(current);
  const nextRule = LEVELS[index + 1];
  if (!nextRule) return { current, next: null };
  const span = nextRule.minTrips - current.minTrips;
  const progressPercent = Math.floor(((trips - current.minTrips) / span) * 100);
  return {
    current,
    next: { ...nextRule, tripsNeeded: nextRule.minTrips - trips, progressPercent },
  };
}

// ── Canje ─────────────────────────────────────────────────────────────────────

export interface RedemptionInput {
  packageTotalCents: number;
  pointsToRedeem: number;
  availablePoints: number;
  completedTrips: number;
}

export interface RedemptionResult {
  pointsUsed: number;
  pointsDiscountCents: number;
  levelDiscountCents: number;
  totalDiscountCents: number;
  finalTotalCents: number;
}

/**
 * Calcula el descuento de un canje.
 * - Sin canje (0 puntos): no hay descuento, tampoco el adicional por nivel.
 * - El canje exige al menos MIN_REDEEM_POINTS y no puede superar los puntos disponibles.
 * - El adicional por nivel se aplica sobre el total del paquete.
 * - El descuento total nunca supera el total del paquete.
 */
export function computeRedemption(input: RedemptionInput): RedemptionResult {
  const { packageTotalCents, availablePoints, completedTrips } = input;
  const pointsToRedeem = Math.floor(input.pointsToRedeem ?? 0);

  if (pointsToRedeem <= 0) {
    return {
      pointsUsed: 0,
      pointsDiscountCents: 0,
      levelDiscountCents: 0,
      totalDiscountCents: 0,
      finalTotalCents: packageTotalCents,
    };
  }
  if (pointsToRedeem < MIN_REDEEM_POINTS) {
    throw new RedemptionError(`El canje mínimo es de ${MIN_REDEEM_POINTS} puntos`);
  }
  if (pointsToRedeem > availablePoints) {
    throw new RedemptionError('No tienes suficientes puntos disponibles');
  }

  const pointsDiscountCents = pointsValueCents(pointsToRedeem);
  const levelPercent = levelForTrips(completedTrips).redeemDiscountPercent;
  const levelDiscountCents = Math.floor((packageTotalCents * levelPercent) / 100);
  const totalDiscountCents = Math.min(packageTotalCents, pointsDiscountCents + levelDiscountCents);

  return {
    pointsUsed: pointsToRedeem,
    pointsDiscountCents,
    levelDiscountCents,
    totalDiscountCents,
    finalTotalCents: packageTotalCents - totalDiscountCents,
  };
}
