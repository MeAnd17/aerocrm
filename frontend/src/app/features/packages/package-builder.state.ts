import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

const DRAFT_KEY = 'aerocrm.paquete';

/**
 * Lugar único donde vive lo que el cliente va eligiendo en el armador (TS-009).
 * Los pasos leen y escriben aquí; ninguno guarda su propia copia (AGENTS.md F8).
 * El estado se puede convertir a texto (serialize) y restaurar (restore) para guardarlo.
 *
 * Los totales que se muestran aquí son solo una vista previa: el precio que vale
 * es el que calcula el servidor al confirmar (AGENTS.md B6).
 */
export interface PackageDraft {
  version: 2;
  /** Usuario dueño del paquete; null si lo armó un visitante. */
  ownerId: number | null;
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
  private readonly auth = inject(AuthService);

  /** Dueño del paquete en curso: null mientras lo arma un visitante. */
  readonly ownerId = signal<number | null>(null);

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
  /** Las actividades se cobran por pasajero. */
  readonly activitiesTotal = computed(() => this.activities().reduce((s, a) => s + Number(a.price), 0) * this.passengers());
  readonly extrasTotal = computed(() => this.extras().reduce((s, e) => s + e.price, 0));
  readonly totalPrice = computed(() => this.flightTotal() + this.hotelTotal() + this.activitiesTotal() + this.extrasTotal());
  /** El descuento lo calcula el motor de fidelización del backend (AGENTS.md B7). */
  readonly pointsDiscount = computed(() => Number(this.redemption()?.totalDiscount ?? 0));

  /** Hay un paquete a medio armar (la barra de navegación ofrece continuarlo). */
  readonly hasDraft = computed(() => this.flightId() !== null);

  constructor() {
    // El paquete a medio armar se guarda en el navegador para no perderlo (modo explorador, M2).
    const saved = readDraft();
    if (saved) this.restore(saved);
    // El paquete pertenece a quien lo armó (ver syncOwner).
    effect(() => {
      const userId = this.auth.currentUser()?.id ?? null;
      untracked(() => this.syncOwner(userId));
    });
    effect(() => {
      const text = this.serialize();
      if (this.flightId() === null) removeDraft();
      else writeDraft(text);
    });
  }

  /**
   * Cambio de sesión con un paquete en curso:
   * - un visitante inicia sesión → el paquete pasa a ser suyo (modo explorador, M2);
   * - el dueño cierra sesión → el paquete se descarta;
   * - entra otro usuario → el paquete del anterior se descarta.
   */
  private syncOwner(userId: number | null) {
    const owner = this.ownerId();
    if (this.flightId() === null) {
      this.ownerId.set(userId);
      return;
    }
    if (owner === userId) return;
    if (owner === null && userId !== null) {
      this.ownerId.set(userId);
      return;
    }
    this.reset();
    this.ownerId.set(userId);
  }

  // ── Acciones ────────────────────────────────────────────────────────────────
  goTo(step: number) {
    this.step.set(step);
  }

  toggleHotel(hotel: any) {
    this.hotel.set(this.hotel()?.id === hotel.id ? null : hotel);
    if (this.hotel() && !this.hotelCheckIn()) this.prefillHotelDates();
  }

  /** Entrada = día de llegada del vuelo; salida = 7 noches después. El cliente puede cambiarlas. */
  private prefillHotelDates() {
    const arrival = this.flight()?.arrivalDate ?? this.flight()?.departureDate;
    if (!arrival) return;
    const entrada = new Date(arrival);
    const salida = new Date(entrada);
    salida.setDate(salida.getDate() + 7);
    this.hotelCheckIn.set(localDate(entrada));
    this.hotelCheckOut.set(localDate(salida));
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
    this.ownerId.set(this.auth.currentUser()?.id ?? null);
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
      version: 2,
      ownerId: this.ownerId(),
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
    if (!draft || draft.version !== 2) return false;
    this.ownerId.set(draft.ownerId ?? null);
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

// El almacenamiento del navegador puede no estar disponible (modo privado): nunca debe romper el armador.
function readDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function writeDraft(text: string) {
  try {
    localStorage.setItem(DRAFT_KEY, text);
  } catch {
    /* sin almacenamiento: el paquete vive solo mientras la pestaña esté abierta */
  }
}

function removeDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nada que limpiar */
  }
}

/** Fecha local en formato AAAA-MM-DD (la que espera un <input type="date">). */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
