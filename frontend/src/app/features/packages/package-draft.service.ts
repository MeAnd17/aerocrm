import { Injectable, signal } from '@angular/core';

const DRAFT_KEY = 'aerocrm.paquete';
const EXPIRY_DAYS = 7;

/**
 * Representa lo que se persiste en localStorage: solo IDs, fechas, cantidades y señales
 * de búsqueda. Nunca precios (AGENTS.md B6). Los objetos completos viven en memoria en
 * PackageBuilderState.
 */
export interface PackageDraft {
  version: 3;
  /** Usuario dueño del paquete; null si lo armó un visitante. */
  ownerId: number | null;
  step: number;
  destinationId: number | null;
  /** ID del vuelo de ida. */
  flightId: number | null;
  /** ID del vuelo de vuelta (reservado para uso futuro). */
  returnFlightId: number | null;
  departureDate: string;
  passengers: number;
  /** ID del hotel elegido; null si no se eligió o se omitió. */
  hotelId: number | null;
  checkIn: string;
  checkOut: string;
  /** Actividades: solo ID y cantidad, sin precio. */
  activitySelections: { activityId: number; quantity: number }[];
  /** IDs de extras elegidos (tipo de extra). */
  extraIds: string[];
  /** Puntos que el cliente quiere canjear; 0 si no los usa. */
  pointsToRedeem: number;
  /** Señales de navegación para personalización futura. */
  searchSignals: {
    viewedDestinationTypes: string[];
    priceRangeFilter: { min: number; max: number } | null;
  };
  /** ISO timestamp de la última vez que se guardó. */
  savedAt: string;
}

/**
 * Capa de persistencia del borrador del paquete (TS-010).
 * Solo guarda IDs, fechas y cantidades; nunca precios ni objetos completos.
 * Caducidad: 7 días desde savedAt. Las señales de búsqueda se acumulan aquí
 * y se envían al backend cuando el usuario inicia sesión.
 */
@Injectable({ providedIn: 'root' })
export class PackageDraftService {
  /** Tipos de destino que el usuario ha visitado en esta sesión. */
  private readonly _viewedTypes = signal<string[]>([]);
  /** Último filtro de precio aplicado en el buscador. */
  private readonly _priceRangeFilter = signal<{ min: number; max: number } | null>(null);

  // ── Lectura ──────────────────────────────────────────────────────────────────

  load(): PackageDraft | null {
    const raw = readRaw();
    if (!raw) return null;
    let draft: PackageDraft;
    try {
      draft = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!draft || draft.version !== 3) {
      // Borrador de versión anterior: descartarlo (puede tener precios)
      this.clear();
      return null;
    }
    if (isExpired(draft.savedAt)) {
      this.clear();
      return null;
    }
    // Restaurar las señales de búsqueda que venían guardadas
    const sig = draft.searchSignals ?? { viewedDestinationTypes: [], priceRangeFilter: null };
    this._viewedTypes.set(sig.viewedDestinationTypes ?? []);
    this._priceRangeFilter.set(sig.priceRangeFilter ?? null);
    return draft;
  }

  save(draft: Omit<PackageDraft, 'version' | 'savedAt' | 'searchSignals'>) {
    const toWrite: PackageDraft = {
      ...draft,
      version: 3,
      returnFlightId: draft.returnFlightId ?? null,
      savedAt: new Date().toISOString(),
      searchSignals: {
        viewedDestinationTypes: this._viewedTypes(),
        priceRangeFilter: this._priceRangeFilter(),
      },
    };
    writeRaw(JSON.stringify(toWrite));
  }

  clear() {
    removeRaw();
    this._viewedTypes.set([]);
    this._priceRangeFilter.set(null);
  }

  // ── Señales de búsqueda ──────────────────────────────────────────────────────

  /** Registra el tipo de destino cuando el usuario lo visita o lo selecciona. */
  recordViewedDestinationType(type: string) {
    if (!type) return;
    const current = this._viewedTypes();
    if (!current.includes(type)) {
      this._viewedTypes.set([...current, type]);
    }
  }

  /** Actualiza el último filtro de precio aplicado. */
  recordPriceRangeFilter(min: number, max: number) {
    this._priceRangeFilter.set({ min, max });
  }

  /** Devuelve las señales acumuladas para enviarlas al backend en el login. */
  getSearchSignals(): PackageDraft['searchSignals'] {
    return {
      viewedDestinationTypes: this._viewedTypes(),
      priceRangeFilter: this._priceRangeFilter(),
    };
  }
}

// ── Helpers de almacenamiento ────────────────────────────────────────────────

function readRaw(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function writeRaw(text: string) {
  try {
    localStorage.setItem(DRAFT_KEY, text);
  } catch {
    /* sin almacenamiento: el paquete vive solo mientras la pestaña esté abierta */
  }
}

function removeRaw() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nada que limpiar */
  }
}

function isExpired(savedAt: string): boolean {
  if (!savedAt) return true;
  try {
    const saved = new Date(savedAt).getTime();
    const now = Date.now();
    return now - saved > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}
