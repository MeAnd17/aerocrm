import { Injectable, computed, signal } from '@angular/core';

/**
 * Lugar único donde vive lo que el cliente va eligiendo en el armador (TS-009).
 * Los pasos leen y escriben aquí; ninguno guarda su propia copia (AGENTS.md F8).
 * El estado se puede convertir a texto (serialize) y restaurar (restore) para guardarlo.
 *
 * Los totales que se muestran aquí son solo una vista previa: el precio que vale
 * es el que calcula el servidor al confirmar (AGENTS.md B6).
 */
export interface PackageDraft {
  version: 1;
  step: number;
  destinationId: number | null;
  flightId: number | null;
  departureDate: string;
  passengers: number;
  flight: any;
  hotel: any;
  hotelCheckIn: string;
  hotelCheckOut: string;
  activities: any[];
  extras: any[];
  usePoints: boolean;
}

@Injectable({ providedIn: 'root' })
export class PackageBuilderState {
  // ── Lo que el cliente elige ─────────────────────────────────────────────────
  readonly step = signal(1);
  readonly destinationId = signal<number | null>(null);
  readonly flightId = signal<number | null>(null);
  readonly departureDate = signal('');
  readonly passengers = signal(1);
  readonly flight = signal<any>(null);
  readonly hotel = signal<any>(null);
  readonly hotelCheckIn = signal('');
  readonly hotelCheckOut = signal('');
  readonly activities = signal<any[]>([]);
  readonly extras = signal<any[]>([]);
  readonly usePoints = signal(false);

  // ── Datos de apoyo que trae el contenedor (no son elecciones) ───────────────
  readonly context = signal<any>(null);
  readonly loyalty = signal<any>(null);
  readonly redemption = signal<any>(null);

  // ── Vista previa de totales ─────────────────────────────────────────────────
  readonly flightTotal = computed(() => Number(this.flight()?.pricePerPerson ?? 0) * this.passengers());
  readonly hotelNights = computed(() => {
    const inDate = this.hotelCheckIn();
    const outDate = this.hotelCheckOut();
    if (!inDate || !outDate) return 0;
    return Math.max(1, Math.round((new Date(outDate).getTime() - new Date(inDate).getTime()) / 86400000));
  });
  readonly hotelTotal = computed(() => Number(this.hotel()?.pricePerNight ?? 0) * Math.max(1, this.hotelNights()));
  readonly activitiesTotal = computed(() => this.activities().reduce((s, a) => s + Number(a.price), 0));
  readonly extrasTotal = computed(() => this.extras().reduce((s, e) => s + e.price, 0));
  readonly totalPrice = computed(() => this.flightTotal() + this.hotelTotal() + this.activitiesTotal() + this.extrasTotal());
  /** El descuento lo calcula el motor de fidelización del backend (AGENTS.md B7). */
  readonly pointsDiscount = computed(() => Number(this.redemption()?.totalDiscount ?? 0));

  // ── Acciones ────────────────────────────────────────────────────────────────
  goTo(step: number) {
    this.step.set(step);
  }

  toggleHotel(hotel: any) {
    this.hotel.set(this.hotel()?.id === hotel.id ? null : hotel);
  }

  toggleActivity(act: any) {
    const curr = this.activities();
    this.activities.set(curr.some((a) => a.id === act.id) ? curr.filter((a) => a.id !== act.id) : [...curr, act]);
  }

  isActivitySelected(id: number) {
    return this.activities().some((a) => a.id === id);
  }

  toggleExtra(extra: any) {
    const curr = this.extras();
    this.extras.set(curr.some((e) => e.type === extra.type) ? curr.filter((e) => e.type !== extra.type) : [...curr, extra]);
  }

  isExtraSelected(type: string) {
    return this.extras().some((e) => e.type === type);
  }

  /** Empieza un paquete nuevo a partir del vuelo elegido en el buscador. */
  start(params: { destinationId: number; flightId: number; departureDate: string; passengers: number }) {
    this.reset();
    this.destinationId.set(params.destinationId);
    this.flightId.set(params.flightId);
    this.departureDate.set(params.departureDate);
    this.passengers.set(params.passengers);
  }

  reset() {
    this.step.set(1);
    this.destinationId.set(null);
    this.flightId.set(null);
    this.departureDate.set('');
    this.passengers.set(1);
    this.flight.set(null);
    this.hotel.set(null);
    this.hotelCheckIn.set('');
    this.hotelCheckOut.set('');
    this.activities.set([]);
    this.extras.set([]);
    this.usePoints.set(false);
    this.context.set(null);
    this.redemption.set(null);
  }

  // ── Conversión a texto ──────────────────────────────────────────────────────
  toDraft(): PackageDraft {
    return {
      version: 1,
      step: this.step(),
      destinationId: this.destinationId(),
      flightId: this.flightId(),
      departureDate: this.departureDate(),
      passengers: this.passengers(),
      flight: this.flight(),
      hotel: this.hotel(),
      hotelCheckIn: this.hotelCheckIn(),
      hotelCheckOut: this.hotelCheckOut(),
      activities: this.activities(),
      extras: this.extras(),
      usePoints: this.usePoints(),
    };
  }

  serialize(): string {
    return JSON.stringify(this.toDraft());
  }

  /** Restaura un paquete guardado con serialize(). Devuelve false si el texto no es válido. */
  restore(text: string): boolean {
    let draft: PackageDraft;
    try {
      draft = JSON.parse(text);
    } catch {
      return false;
    }
    if (!draft || draft.version !== 1) return false;
    this.step.set(draft.step ?? 1);
    this.destinationId.set(draft.destinationId ?? null);
    this.flightId.set(draft.flightId ?? null);
    this.departureDate.set(draft.departureDate ?? '');
    this.passengers.set(draft.passengers ?? 1);
    this.flight.set(draft.flight ?? null);
    this.hotel.set(draft.hotel ?? null);
    this.hotelCheckIn.set(draft.hotelCheckIn ?? '');
    this.hotelCheckOut.set(draft.hotelCheckOut ?? '');
    this.activities.set(draft.activities ?? []);
    this.extras.set(draft.extras ?? []);
    this.usePoints.set(!!draft.usePoints);
    this.redemption.set(null);
    return true;
  }
}
