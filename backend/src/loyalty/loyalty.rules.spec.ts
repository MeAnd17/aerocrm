import {
  computeRedemption,
  fromCents,
  levelForTrips,
  levelStatus,
  pointsForPurchase,
  pointsValueCents,
  RedemptionError,
  toCents,
} from './loyalty.rules';

describe('Motor de fidelización', () => {
  describe('dinero en céntimos', () => {
    it('convierte sin errores de coma flotante', () => {
      expect(toCents('0.10')).toBe(10);
      expect(toCents('1234.56')).toBe(123456);
      expect(toCents(0.1 + 0.2)).toBe(30);
      expect(toCents('99.999')).toBe(10000);
      expect(fromCents(123456)).toBe('1234.56');
      expect(fromCents(5)).toBe('0.05');
    });
  });

  describe('puntos por compra', () => {
    it('otorga 1 punto por cada S/ 100 pagados, redondeando hacia abajo', () => {
      expect(pointsForPurchase(toCents('99.99'))).toBe(0);
      expect(pointsForPurchase(toCents('100.00'))).toBe(1);
      expect(pointsForPurchase(toCents('199.99'))).toBe(1);
      expect(pointsForPurchase(toCents('2450.50'))).toBe(24);
      expect(pointsForPurchase(0)).toBe(0);
    });

    it('500 puntos valen exactamente S/ 50', () => {
      expect(pointsValueCents(500)).toBe(5000);
    });
  });

  describe('niveles por viajes completados', () => {
    it.each([
      [0, 'EXPLORADOR'],
      [2, 'EXPLORADOR'],
      [3, 'VIAJERO'],
      [7, 'VIAJERO'],
      [8, 'FRECUENTE'],
      [14, 'FRECUENTE'],
      [15, 'ELITE'],
      [40, 'ELITE'],
    ])('%i viajes → %s', (trips, level) => {
      expect(levelForTrips(trips).level).toBe(level);
    });

    it('informa el siguiente nivel y el avance', () => {
      const s = levelStatus(5);
      expect(s.current.level).toBe('VIAJERO');
      expect(s.next?.level).toBe('FRECUENTE');
      expect(s.next?.tripsNeeded).toBe(3);
      expect(s.next?.progressPercent).toBe(40);
    });

    it('Elite no tiene siguiente nivel', () => {
      expect(levelStatus(15).next).toBeNull();
    });
  });

  describe('canje', () => {
    const base = { packageTotalCents: toCents('3000.00'), availablePoints: 1000, completedTrips: 0 };

    it('rechaza 499 puntos y acepta 500', () => {
      expect(() => computeRedemption({ ...base, pointsToRedeem: 499 })).toThrow(RedemptionError);
      expect(computeRedemption({ ...base, pointsToRedeem: 500 }).pointsDiscountCents).toBe(5000);
    });

    it('rechaza canjear más puntos de los disponibles', () => {
      expect(() => computeRedemption({ ...base, pointsToRedeem: 1001 })).toThrow('No tienes suficientes puntos disponibles');
    });

    it('sin canje no hay descuento por nivel', () => {
      const r = computeRedemption({ ...base, completedTrips: 20, pointsToRedeem: 0 });
      expect(r.totalDiscountCents).toBe(0);
      expect(r.finalTotalCents).toBe(base.packageTotalCents);
    });

    it.each([
      [2, 0],
      [3, 15000],
      [7, 15000],
      [8, 30000],
      [14, 30000],
      [15, 45000],
    ])('con %i viajes el adicional por nivel es %i céntimos sobre S/ 3000', (trips, levelDiscount) => {
      const r = computeRedemption({ ...base, completedTrips: trips, pointsToRedeem: 500 });
      expect(r.levelDiscountCents).toBe(levelDiscount);
      expect(r.totalDiscountCents).toBe(5000 + levelDiscount);
    });

    it('maneja totales con céntimos', () => {
      const r = computeRedemption({
        packageTotalCents: toCents('1999.99'),
        availablePoints: 600,
        completedTrips: 3,
        pointsToRedeem: 600,
      });
      expect(r.pointsDiscountCents).toBe(6000);
      expect(r.levelDiscountCents).toBe(9999); // 5 % de 1999.99 = 99.9995 → 99.99
      expect(r.finalTotalCents).toBe(199999 - 6000 - 9999);
    });

    it('el descuento nunca supera el total del paquete', () => {
      const r = computeRedemption({
        packageTotalCents: toCents('40.00'),
        availablePoints: 5000,
        completedTrips: 15,
        pointsToRedeem: 5000,
      });
      expect(r.totalDiscountCents).toBe(4000);
      expect(r.finalTotalCents).toBe(0);
    });
  });
});
