import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

/** Respuesta parcial de GET /contact con paginación. */
interface RespuestaContacto { total: number; }

/**
 * Mantiene el contador de consultas pendientes accesible desde el shell y desde
 * el componente de consultas (US-030). Ambos componentes leen el mismo signal.
 */
@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  private readonly api = inject(ApiService);

  readonly pendientes = signal(0);

  /** Recarga el contador desde la API. */
  refrescarPendientes() {
    this.api.get<RespuestaContacto>('contact', { status: 'PENDIENTE', limit: '1' }).subscribe({
      next: (data) => this.pendientes.set(data.total),
      error: () => this.pendientes.set(0),
    });
  }
}
