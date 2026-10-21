import { Injectable } from '@angular/core';

/**
 * Stub del servicio de WebSocket de vuelos.
 * Pendiente de implementación real cuando se integre el backend de WS.
 */
@Injectable({ providedIn: 'root' })
export class FlightsSocketService {
  isConnected = false;

  connect(): void {
    // TODO: implementar conexión WebSocket real
  }

  disconnect(): void {
    // TODO: implementar desconexión
  }
}
