import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface FlightStatusUpdate {
  flightId: number;
  flightNumber: string;
  status: string;
  reason?: string;
  updatedAt: string;
  origin?: string;
  destination?: string;
}

@Injectable({ providedIn: 'root' })
export class FlightsSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private flightUpdates$ = new Subject<FlightStatusUpdate>();
  private dashboardActivity$ = new Subject<any>();
  isConnected = false;

  flightStatusUpdated$ = this.flightUpdates$.asObservable();
  dashboardActivityReceived$ = this.dashboardActivity$.asObservable();

  constructor(private auth: AuthService) {}

  connect() {
    if (this.socket?.connected) return;
    const token = this.auth.getToken();
    this.socket = io(`${environment.wsUrl}/flights`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => { this.isConnected = true; });
    this.socket.on('disconnect', () => { this.isConnected = false; });
    this.socket.on('flight:status-updated', (data: FlightStatusUpdate) => this.flightUpdates$.next(data));
    this.socket.on('dashboard:activity', (data: any) => this.dashboardActivity$.next(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  ngOnDestroy() { this.disconnect(); }
}
