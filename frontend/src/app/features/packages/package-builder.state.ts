import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PackageDraftService } from './package-draft.service';

/**
 * Datos de un pasajero mientras se arma el paquete (US-010).
 * No se persisten en localStorage: se rellenan de nuevo en el paso 6 si se recarga.
 */
export interface PassengerDraft {
  firstName: string;
  lastName: string;
  /** DNI o PASAPORTE. */
  documentType: 'DNI' | 'PASAPORTE';
  documentNumber: string;
  /** Fecha de nacimiento en formato ISO AAAA-MM-DD. */
  birthDate: string;
  /** El primer pasajero es el titular; sus datos vienen del usuario autenticado. */
  isHolder: boolean;
  /** Solo UI: si está marcado, se llama POST /clients/me/travelers al continuar. */
  saveAsTraveler?: boolean;
}

/**
 * Lugar único donde vive lo que el cliente va eligiendo en el armador (TS-009, TS-010).
 * Los pasos leen y escriben aquí; ninguno guarda su propia copia (AGENTS.md F8).
 *
 * En localStorage se persisten SOLO IDs, fechas y cantidades — nunca objetos completos
 * con precios (TS-010). Los objetos completos (flight, hotel, activities, extras) viven
 * únicamente en memoria. Si hay un ID en el draft pero no el objeto en memoria, el
 * contenedor (PackageBuilderComponent) los recupera del servidor.
 *
 * Los totales que se muestran aquí son solo una vista previa: el precio que vale
 * es el que calcula el servidor al confirmar (AGENTS.md B6).
 */
@Injectable({ providedIn: 'root' })
export class PackageBuilderState {
  private readonly auth = inject(AuthService);
  private readonly draftService = inject(PackageDraftService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  /** Dueño del paquete en curso: null mientras lo arma un visitante. */
  readonly ownerId = signal<number | null>(null);

  // ── Elecciones del cliente (IDs y valores simples) ───────────────────────────
  readonly step = signal(1);
  readonly destinationId = signal<number | null>(null);
  readonly flightId = signal<number | null>(null);
  readonly returnFlightId = signal<number | null>(null);
  readonly departureDate = signal('');
  readonly passengers = signal(1);
  readonly hotelId = signal<number | null>(null);
  readonly hotelCheckIn = signal('');
  readonly hotelCheckOut = signal('');
  /** Actividades: ID + cantidad. Se sincroniza con activitySelections. */
  readonly activitySelections = signal<{ activityId: number; quantity: number }[]>([]);
  /** IDs (tipos) de extras elegidos. */
  readonly extraIds = signal<string[]>([]);
  readonly pointsToRedeem = signal(0);
  readonly usePoints = signal(false);
  /** Datos de cada pasajero ingresados en el paso 6 (US-010). No se persisten en localStorage. */
  readonly passengerDrafts = signal<PassengerDraft[]>([]);

  // ── Objetos completos en memoria (nunca van a localStorage) ─────────────────
  readonly flight = signal<any>(null);
  /** Objeto completo del vuelo de regreso (nunca va a localStorage). */
  readonly returnFlight = signal<any>(null);
  readonly hotel = signal<any>(null);
  /** Actividades completas (con nombre, precio, etc.) para mostrar en UI. */
  readonly activities = signal<any[]>([]);
  /** Extras completos (con label y precio) para mostrar en UI. */
  readonly extras = signal<any[]>([]);

  // ── Datos de apoyo que trae el contenedor ────────────────────────────────────
  readonly context = signal<any>(null);
  readonly loyalty = signal<any>(null);
  readonly redemption = signal<any>(null);

  // ── Vista previa de totales ─────────────────────────────────────────────────
  readonly flightTotal = computed(() => Number(this.flight()?.pricePerPerson ?? 0) * this.passengers());
  readonly returnFlightTotal = computed(() => Number(this.returnFlight()?.pricePerPerson ?? 0) * this.passengers());
  readonly hotelNights = computed(() => {
    const inDate = this.hotelCheckIn();
    const outDate = this.hotelCheckOut();
    if (!inDate || !outDate) return 0;
    return Math.max(1, Math.round((new Date(outDate).getTime() - new Date(inDate).getTime()) / 86400000));
  });
  readonly hotelTotal = computed(() => Number(this.hotel()?.pricePerNight ?? 0) * Math.max(1, this.hotelNights()));
  /** Las actividades se cobran según la cantidad elegida por actividad (US-014). Vista previa local; el precio real viene del servidor (B6). */
  readonly activitiesTotal = computed(() => {
    const selections = this.activitySelections();
    return this.activities().reduce((sum, a) => {
      const sel = selections.find(s => s.activityId === a.id);
      const qty = sel?.quantity ?? this.passengers();
      return sum + Number(a.price) * qty;
    }, 0);
  });
  readonly extrasTotal = computed(() =>
    this.extras().reduce((s, e) => {
      const lineTotal = e.pricing === 'POR_PASAJERO'
        ? Number(e.price) * this.passengers()
        : Number(e.price);
      return s + lineTotal;
    }, 0),
  );
  readonly totalPrice = computed(() => this.flightTotal() + this.returnFlightTotal() + this.hotelTotal() + this.activitiesTotal() + this.extrasTotal());
  /** El descuento lo calcula el motor de fidelización del backend (AGENTS.md B7). */
  readonly pointsDiscount = computed(() => Number(this.redemption()?.totalDiscount ?? 0));

  /** Hay un paquete a medio armar (la barra de navegación ofrece continuarlo). */
  readonly hasDraft = computed(() => this.flightId() !== null);

  /** Indica si el objeto completo del vuelo aún no está en memoria pero hay un ID guardado. */
  readonly needsFlightReload = computed(() => this.flightId() !== null && this.flight() === null);

  constructor() {
    // Restaurar desde localStorage (versión 3: solo IDs, sin precios)
    const saved = this.draftService.load();
    if (saved) this._restoreFromDraft(saved);

    // Sincronizar dueño cuando cambia la sesión
    effect(() => {
      const userId = this.auth.currentUser()?.id ?? null;
      untracked(() => this._syncOwner(userId));
    });

    // Persistir en localStorage solo IDs/fechas/cantidades (sin precios)
    effect(() => {
      if (this.flightId() === null) {
        this.draftService.clear();
      } else {
        this.draftService.save({
          ownerId: this.ownerId(),
          step: this.step(),
          destinationId: this.destinationId(),
          flightId: this.flightId(),
          returnFlightId: this.returnFlightId(),
          departureDate: this.departureDate(),
          passengers: this.passengers(),
          hotelId: this.hotelId(),
          checkIn: this.hotelCheckIn(),
          checkOut: this.hotelCheckOut(),
          activitySelections: this.activitySelections(),
          extraIds: this.extraIds(),
          pointsToRedeem: this.pointsToRedeem(),
        });
      }
    });
  }

  /**
   * Cambio de sesión con un paquete en curso:
   * - un visitante inicia sesión → el paquete pasa a ser suyo (modo explorador, M2);
   * - el dueño cierra sesión → el paquete se descarta;
   * - entra otro usuario → el paquete del anterior se descarta.
   */
  private _syncOwner(userId: number | null) {
    const owner = this.ownerId();
    if (this.flightId() === null) {
      this.ownerId.set(userId);
      return;
    }
    if (owner === userId) return;
    if (owner === null && userId !== null) {
      this.ownerId.set(userId);
      this._adoptarBorrador();
      return;
    }
    this.reset();
    this.ownerId.set(userId);
  }

  /**
   * Al adoptar el borrador de un visitante que acaba de iniciar sesión, reemplaza
   * los datos del titular con los del usuario autenticado (US-010).
   * Solo actúa si el paso 6 ya fue completado (passengerDrafts no vacío);
   * si está vacío, StepPassengersComponent se encarga al instanciarse.
   */
  private _adoptarBorrador() {
    const drafts = this.passengerDrafts();
    if (drafts.length === 0) return;

    const usuario = this.auth.currentUser();
    if (!usuario) return;

    const titular = drafts[0];
    const nombreDiferente =
      titular.firstName.trim() !== '' &&
      (titular.firstName !== usuario.firstName || titular.lastName !== usuario.lastName);

    // Reemplazar nombre del titular de inmediato (disponible sin llamada a la API).
    this.passengerDrafts.set(
      drafts.map((p, i) =>
        i === 0 ? { ...p, firstName: usuario.firstName, lastName: usuario.lastName } : p,
      ),
    );

    if (nombreDiferente) {
      this.toast.info(
        'El titular de la reserva es el dueño de la cuenta. Si viaja otra persona, agrégala como acompañante.',
      );
    }

    // Completar con documento y fecha de nacimiento del perfil si existen.
    this.api.get<{ documentType?: 'DNI' | 'PASAPORTE'; documentNumber?: string; dateOfBirth?: string }>('clients/me').subscribe({
      next: (perfil) => {
        const actual = this.passengerDrafts();
        if (actual.length === 0) return;
        const t = actual[0];
        this.passengerDrafts.set(
          actual.map((p, i) =>
            i === 0
              ? {
                  ...p,
                  documentType: perfil.documentType ?? t.documentType,
                  documentNumber: perfil.documentNumber?.trim() ? perfil.documentNumber : t.documentNumber,
                  birthDate: perfil.dateOfBirth ? perfil.dateOfBirth.split('T')[0] : t.birthDate,
                }
              : p,
          ),
        );
      },
      error: () => {
        // No crítico: el titular ya tiene al menos el nombre de la cuenta.
      },
    });
  }

  // ── Acciones ────────────────────────────────────────────────────────────────

  goTo(step: number) {
    this.step.set(step);
  }

  toggleHotel(hotel: any) {
    const same = this.hotel()?.id === hotel.id;
    this.hotel.set(same ? null : hotel);
    this.hotelId.set(same ? null : hotel.id);
    if (this.hotel() && !this.hotelCheckIn()) this._prefillHotelDates();
  }

  /** Entrada = día de llegada del vuelo de ida; salida = día de salida del vuelo de regreso. */
  private _prefillHotelDates() {
    const arrival = this.flight()?.arrivalDate ?? this.flight()?.departureDate;
    if (!arrival) return;
    const entrada = new Date(arrival);
    // La salida propuesta es la fecha de salida del vuelo de regreso; si no hay vuelo de
    // regreso, se propone una noche después (mínimo válido).
    const returnDep = this.returnFlight()?.departureDate;
    const salida = returnDep ? new Date(returnDep) : (() => { const d = new Date(entrada); d.setDate(d.getDate() + 1); return d; })();
    this.hotelCheckIn.set(localDate(entrada));
    this.hotelCheckOut.set(localDate(salida));
  }

  toggleActivity(act: any) {
    const curr = this.activities();
    const currSelections = this.activitySelections();
    if (curr.some((a) => a.id === act.id)) {
      this.activities.set(curr.filter((a) => a.id !== act.id));
      this.activitySelections.set(currSelections.filter((s) => s.activityId !== act.id));
    } else {
      this.activities.set([...curr, act]);
      this.activitySelections.set([...currSelections, { activityId: act.id, quantity: this.passengers() }]);
    }
  }

  isActivitySelected(id: number) {
    return this.activities().some((a) => a.id === id);
  }

  /** Actualiza la cantidad de personas para una actividad ya seleccionada (US-014). */
  setActivityQuantity(change: { activityId: number; quantity: number }) {
    const curr = this.activitySelections();
    const updated = curr.map(s =>
      s.activityId === change.activityId ? { ...s, quantity: change.quantity } : s,
    );
    this.activitySelections.set(updated);
  }

  private static readonly TRASLADO_TYPES = ['TRASLADO_IDA', 'TRASLADO_VUELTA', 'TRASLADO_COMPLETO'];

  /**
   * Selecciona un traslado (excluyente: deselecciona los otros tres tipos de traslado).
   * Si ya estaba seleccionado, lo deselecciona.
   */
  selectTransfer(extra: any) {
    const curr = this.extras();
    const currIds = this.extraIds();
    const alreadySelected = curr.some(e => e.type === extra.type);
    // Quitar cualquier traslado previo
    const withoutTransfers = curr.filter(e => !PackageBuilderState.TRASLADO_TYPES.includes(e.type));
    const idsWithoutTransfers = currIds.filter(id => !PackageBuilderState.TRASLADO_TYPES.includes(id));
    if (alreadySelected) {
      // Deseleccionar
      this.extras.set(withoutTransfers);
      this.extraIds.set(idsWithoutTransfers);
    } else {
      // Seleccionar el nuevo
      this.extras.set([...withoutTransfers, extra]);
      this.extraIds.set([...idsWithoutTransfers, extra.type]);
    }
  }

  toggleExtra(extra: any) {
    const curr = this.extras();
    const currIds = this.extraIds();
    if (curr.some((e) => e.type === extra.type)) {
      this.extras.set(curr.filter((e) => e.type !== extra.type));
      this.extraIds.set(currIds.filter((id) => id !== extra.type));
    } else {
      this.extras.set([...curr, extra]);
      this.extraIds.set([...currIds, extra.type]);
    }
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
    this.returnFlightId.set(null);
    this.departureDate.set('');
    this.passengers.set(1);
    this.hotelId.set(null);
    this.hotel.set(null);
    this.hotelCheckIn.set('');
    this.hotelCheckOut.set('');
    this.activitySelections.set([]);
    this.activities.set([]);
    this.extraIds.set([]);
    this.extras.set([]);
    this.pointsToRedeem.set(0);
    this.usePoints.set(false);
    this.passengerDrafts.set([]);
    this.flight.set(null);
    this.returnFlight.set(null);
    this.context.set(null);
    this.redemption.set(null);
  }

  // ── Restauración desde draft guardado ────────────────────────────────────────

  private _restoreFromDraft(draft: import('./package-draft.service').PackageDraft): void {
    this.ownerId.set(draft.ownerId ?? null);
    this.step.set(draft.step ?? 1);
    this.destinationId.set(draft.destinationId ?? null);
    this.flightId.set(draft.flightId ?? null);
    this.returnFlightId.set(draft.returnFlightId ?? null);
    this.departureDate.set(draft.departureDate ?? '');
    this.passengers.set(draft.passengers ?? 1);
    this.hotelId.set(draft.hotelId ?? null);
    this.hotelCheckIn.set(draft.checkIn ?? '');
    this.hotelCheckOut.set(draft.checkOut ?? '');
    this.activitySelections.set(draft.activitySelections ?? []);
    this.extraIds.set(draft.extraIds ?? []);
    this.pointsToRedeem.set(draft.pointsToRedeem ?? 0);
    // Los objetos completos (flight, hotel, activities, extras) NO están en el draft.
    // El contenedor los carga del servidor cuando detecta needsFlightReload().
    this.flight.set(null);
    this.returnFlight.set(null);
    this.hotel.set(null);
    this.activities.set([]);
    this.extras.set([]);
    this.redemption.set(null);
  }
}

/** Fecha local en formato AAAA-MM-DD (la que espera un <input type="date">). */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
