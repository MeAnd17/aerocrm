import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FlightsSocketService } from '../../../core/services/flights-socket.service';
import { FlightStatusLabelPipe } from '../../../shared/pipes/flight-status.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-departure-board',
  standalone: true,
  imports: [CommonModule, RouterLink, FlightStatusLabelPipe],
  template: `
    <div class="departure-board min-h-screen bg-navy-950 rounded-2xl overflow-hidden">
      <!-- Board Header -->
      <div class="bg-gradient-to-r from-navy-950 to-navy-900 border-b border-gold-500/20 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gold-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white font-mono tracking-widest">SALIDAS</h1>
            <p class="text-xs text-gold-400/70 font-mono">OPERACIONES EN VIVO</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right font-mono">
            <p class="text-2xl font-bold text-white">{{ currentTime }}</p>
            <p class="text-xs text-navy-400">{{ currentDate }}</p>
          </div>
          <div class="flex items-center gap-2 text-xs" [class.text-emerald-400]="wsConnected" [class.text-amber-400]="!wsConnected">
            <span class="w-2 h-2 rounded-full" [class.bg-emerald-400]="wsConnected" [class.bg-amber-400]="!wsConnected" [class.animate-pulse]="!wsConnected"></span>
            EN VIVO
          </div>
          <a routerLink="/flights" class="btn-ghost text-xs py-1.5 px-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
            Volver
          </a>
        </div>
      </div>

      <!-- Column headers -->
      <div class="grid font-mono text-xs text-gold-400/60 uppercase tracking-widest px-6 py-3 border-b border-navy-800"
           style="grid-template-columns: 140px 100px 1fr 120px 100px 80px 160px">
        <span>FLIGHT</span>
        <span>TIME</span>
        <span>DESTINATION</span>
        <span>GATE</span>
        <span>TERMINAL</span>
        <span>SEATS</span>
        <span>STATUS</span>
      </div>

      <!-- Rows -->
      <div *ngIf="loading()" class="p-6 space-y-px">
        <div *ngFor="let _ of [1,2,3,4,5,6,7,8]" class="skeleton h-16 rounded-none bg-navy-800/30"></div>
      </div>

      <div *ngIf="!loading()">
        <div *ngFor="let f of flights(); trackBy: trackFlight"
             class="grid items-center px-6 py-4 border-b border-navy-800/60 hover:bg-navy-800/20 transition-colors cursor-pointer"
             style="grid-template-columns: 140px 100px 1fr 120px 100px 80px 160px"
             [class.border-l-4]="true"
             [ngClass]="getRowBorderClass(f.status)"
             [routerLink]="['/flights', f.id]">

          <!-- Flight number -->
          <span class="text-xl font-bold font-mono text-white tracking-widest">{{ f.flightNumber }}</span>

          <!-- Departure time -->
          <div>
            <span class="text-2xl font-bold font-mono" [ngClass]="f.status === 'DELAYED' ? 'text-amber-400' : 'text-white'">
              {{ f.scheduledDeparture | date:'HH:mm' }}
            </span>
            <span *ngIf="f.actualDeparture" class="text-xs text-navy-500 block font-mono">
              Act: {{ f.actualDeparture | date:'HH:mm' }}
            </span>
          </div>

          <!-- Destination -->
          <div>
            <p class="text-white font-semibold">{{ f.route?.destination?.city }}</p>
            <p class="text-navy-400 text-sm font-mono">{{ f.route?.destination?.iataCode }} — {{ f.route?.destination?.country }}</p>
          </div>

          <!-- Gate -->
          <span class="text-2xl font-bold font-mono text-gold-400">{{ f.gate?.code ?? '—' }}</span>

          <!-- Terminal -->
          <span class="text-lg font-mono text-navy-300">{{ f.gate?.terminal ?? '—' }}</span>

          <!-- Seats -->
          <span class="text-sm font-mono text-navy-300">{{ f._count?.reservations || 0 }}/{{ f.totalSeats }}</span>

          <!-- Status -->
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" [ngClass]="getStatusDotClass(f.status)"></span>
            <span class="text-sm font-bold font-mono tracking-wider" [ngClass]="getStatusTextClass(f.status)">
              {{ f.status | flightStatusLabel | uppercase }}
            </span>
          </div>
        </div>

        <div *ngIf="flights().length === 0" class="flex flex-col items-center py-20 text-navy-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
          <p class="font-mono text-lg tracking-widest">SIN VUELOS PROGRAMADOS</p>
        </div>
      </div>
    </div>
  `,
})
export class DepartureBoardComponent implements OnInit, OnDestroy {
  flights = signal<any[]>([]);
  loading = signal(true);
  currentTime = '';
  currentDate = '';
  private timerInterval: any;
  private sub?: Subscription;

  constructor(private api: ApiService, private socket: FlightsSocketService) {}
  get wsConnected() { return this.socket.isConnected; }

  ngOnInit() {
    this.updateClock();
    this.timerInterval = setInterval(() => this.updateClock(), 1000);
    this.api.get<any>('flights', { limit: 30 }).subscribe({
      next: res => { this.flights.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.sub = this.socket.flightStatusUpdated$.subscribe(u => {
      this.flights.update(list => list.map(f => f.id === u.flightId ? { ...f, status: u.status } : f));
    });
  }

  ngOnDestroy() { clearInterval(this.timerInterval); this.sub?.unsubscribe(); }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    this.currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  trackFlight(_: number, f: any) { return f.id; }

  getRowBorderClass(s: string) {
    const map: Record<string, string> = {
      ON_TIME: 'border-l-emerald-500', DELAYED: 'border-l-amber-500',
      CANCELLED: 'border-l-red-500', BOARDING: 'border-l-purple-500',
      DEPARTED: 'border-l-blue-500', LANDED: 'border-l-gray-500', DIVERTED: 'border-l-orange-500',
    };
    return map[s] || 'border-l-navy-700';
  }

  getStatusDotClass(s: string) {
    const map: Record<string, string> = {
      ON_TIME: 'bg-emerald-400', DELAYED: 'bg-amber-400', CANCELLED: 'bg-red-400',
      BOARDING: 'bg-purple-400', DEPARTED: 'bg-blue-400', LANDED: 'bg-gray-400', DIVERTED: 'bg-orange-400',
    };
    return map[s] || 'bg-gray-400';
  }

  getStatusTextClass(s: string) {
    const map: Record<string, string> = {
      ON_TIME: 'text-emerald-400', DELAYED: 'text-amber-400', CANCELLED: 'text-red-400',
      BOARDING: 'text-purple-400', DEPARTED: 'text-blue-400', LANDED: 'text-gray-400', DIVERTED: 'text-orange-400',
    };
    return map[s] || 'text-navy-300';
  }
}
