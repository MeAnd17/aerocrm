import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-package-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <button (click)="router.navigate(['/search'])" class="text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 class="text-2xl font-bold text-gray-800">Arma tu paquete</h1>
      </div>

      <!-- Steps indicator -->
      <div class="flex items-center gap-2">
        @for (s of steps; track s.n; let i = $index) {
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              [class.bg-blue-600]="currentStep() >= s.n"
              [class.text-white]="currentStep() >= s.n"
              [class.bg-gray-100]="currentStep() < s.n"
              [class.text-gray-400]="currentStep() < s.n">
              {{ s.n }}
            </div>
            <span class="text-xs hidden sm:block" [class.text-blue-600]="currentStep() >= s.n" [class.text-gray-400]="currentStep() < s.n">{{ s.label }}</span>
            @if (i < steps.length - 1) { <div class="w-4 h-0.5 bg-gray-200"></div> }
          </div>
        }
      </div>

      <!-- Step 1: Vuelo (ya seleccionado) -->
      @if (currentStep() >= 1 && flight()) {
        <div class="bg-white rounded-xl border shadow-sm p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-blue-600 font-semibold text-sm">✈️ Vuelo seleccionado</span>
          </div>
          <p class="font-bold">{{ flight()?.airline }} {{ flight()?.flightNumber }}</p>
          <p class="text-sm text-gray-500">{{ flight()?.origin?.city }} → {{ flight()?.destination?.city }}</p>
          <p class="text-sm font-bold text-blue-900 mt-1">S/. {{ flightTotal() | number:'1.2-2' }}</p>
        </div>
      }

      <!-- Step 2: Contexto del destino -->
      @if (currentStep() === 2 && context()) {
        <div class="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <h3 class="font-semibold text-gray-800 mb-2">🌍 En {{ context()?.destination?.city }} durante tu viaje</h3>
          @if (context()?.festivities?.length) {
            @for (fest of context()?.festivities; track fest.id) {
              <p class="text-sm text-orange-700">🎭 {{ fest.name }}</p>
            }
          }
          @if (context()?.holidays?.length) {
            @for (h of context()?.holidays; track h.name) {
              <p class="text-sm text-blue-700">📅 {{ h.name }} ({{ h.date | date:'dd/MM' }})</p>
            }
          }
          @if (context()?.weather) {
            <p class="text-sm text-gray-600 mt-1">🌤️ {{ context()?.weather?.forecast?.[0]?.description }}, {{ context()?.weather?.forecast?.[0]?.temp_min }}°C - {{ context()?.weather?.forecast?.[0]?.temp_max }}°C</p>
          }
        </div>
        <button (click)="currentStep.set(3)" class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
          Continuar → Elegir hotel
        </button>
      }

      <!-- Step 3: Hotel -->
      @if (currentStep() === 3) {
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-3">🏨 Elige tu hotel <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
          <div class="space-y-2 mb-3">
            @for (hotel of context()?.hotels; track hotel.id) {
              <div (click)="toggleHotel(hotel)"
                [class.ring-2]="selectedHotel()?.id === hotel.id"
                [class.ring-blue-500]="selectedHotel()?.id === hotel.id"
                class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
                <div>
                  <p class="font-medium text-sm">{{ hotel.name }}</p>
                  <p class="text-xs text-gray-500">{{ '⭐'.repeat(hotel.stars) }} · {{ hotel.zone }}</p>
                </div>
                <p class="font-bold text-blue-900 text-sm">S/. {{ hotel.pricePerNight }}/noche</p>
              </div>
            }
          </div>
          @if (selectedHotel()) {
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Check-in</label>
                <input type="date" [(ngModel)]="hotelCheckIn"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Check-out</label>
                <input type="date" [(ngModel)]="hotelCheckOut"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          }
          <div class="flex gap-3 mt-3">
            <button (click)="currentStep.set(4)" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
              Continuar
            </button>
            <button (click)="selectedHotel.set(null); currentStep.set(4)" class="text-sm text-gray-400 hover:text-gray-600 px-3">
              Omitir
            </button>
          </div>
        </div>
      }

      <!-- Step 4: Actividades -->
      @if (currentStep() === 4) {
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-3">🎯 Actividades <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
          <div class="space-y-2 mb-3">
            @for (act of context()?.activities; track act.id) {
              <div (click)="toggleActivity(act)"
                [class.ring-2]="isActivitySelected(act.id)"
                [class.ring-blue-500]="isActivitySelected(act.id)"
                class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
                <div>
                  <p class="font-medium text-sm">{{ act.name }}</p>
                  <p class="text-xs text-gray-500">{{ act.type }} · {{ act.durationHours }}h</p>
                </div>
                <p class="font-bold text-blue-900 text-sm">S/. {{ act.price }}</p>
              </div>
            }
          </div>
          <div class="flex gap-3">
            <button (click)="currentStep.set(5)" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
              Continuar
            </button>
            <button (click)="selectedActivities.set([]); currentStep.set(5)" class="text-sm text-gray-400 px-3">Omitir</button>
          </div>
        </div>
      }

      <!-- Step 5: Extras -->
      @if (currentStep() === 5) {
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h3 class="font-semibold text-gray-800 mb-3">➕ Extras <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
          <div class="space-y-2 mb-3">
            @for (extra of extraOptions; track extra.type) {
              <div (click)="toggleExtra(extra)"
                [class.ring-2]="isExtraSelected(extra.type)"
                [class.ring-blue-500]="isExtraSelected(extra.type)"
                class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
                <p class="font-medium text-sm">{{ extra.label }}</p>
                <p class="font-bold text-blue-900 text-sm">S/. {{ extra.price }}</p>
              </div>
            }
          </div>
          <button (click)="currentStep.set(6)" class="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
            Ver resumen
          </button>
        </div>
      }

      <!-- Step 6: Resumen y pago -->
      @if (currentStep() === 6) {
        <div class="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h3 class="font-semibold text-gray-800">📋 Resumen del paquete</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span>✈️ Vuelo ({{ passengers() }} pax)</span><span class="font-semibold">S/. {{ flightTotal() | number:'1.2-2' }}</span></div>
            @if (selectedHotel()) {
              <div class="flex justify-between"><span>🏨 {{ selectedHotel()?.name }} ({{ hotelNights() }} noches)</span><span class="font-semibold">S/. {{ hotelTotal() | number:'1.2-2' }}</span></div>
            }
            @for (act of selectedActivities(); track act.id) {
              <div class="flex justify-between"><span>🎯 {{ act.name }}</span><span class="font-semibold">S/. {{ act.price }}</span></div>
            }
            @for (extra of selectedExtras(); track extra.type) {
              <div class="flex justify-between"><span>➕ {{ extra.label }}</span><span class="font-semibold">S/. {{ extra.price }}</span></div>
            }
            <div class="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total</span><span class="text-blue-900">S/. {{ totalPrice() | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Puntos a canjear -->
          @if (loyalty()?.canRedeem) {
            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-sm font-medium text-blue-800 mb-2">
                Tienes {{ loyalty()?.availablePoints }} puntos (S/. {{ loyalty()?.availablePointsValue }} de descuento)
              </p>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [ngModel]="usePoints" (ngModelChange)="onUsePointsChange($event)" class="rounded" />
                Canjear {{ loyalty()?.availablePoints }} puntos
                @if (redemption()) { y ahorrar S/. {{ pointsDiscount() | number:'1.2-2' }} }
              </label>
            </div>
          }

          @if (error()) {
            <p class="text-red-600 text-sm">{{ error() }}</p>
          }

          <button (click)="confirmBooking()" [disabled]="loading()"
            class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50">
            {{ loading() ? 'Confirmando...' : '✅ Confirmar y pagar S/. ' + (usePoints ? (totalPrice() - pointsDiscount()) : totalPrice() | number:'1.2-2') }}
          </button>
        </div>
      }
    </div>
  `,
})
export class PackageBuilderComponent implements OnInit {
  currentStep = signal(1);
  flight = signal<any>(null);
  context = signal<any>(null);
  selectedHotel = signal<any>(null);
  selectedActivities = signal<any[]>([]);
  selectedExtras = signal<any[]>([]);
  loading = signal(false);
  error = signal('');
  passengers = signal(1);
  hotelCheckIn = '';
  hotelCheckOut = '';
  usePoints = false;
  loyalty = signal<any>(null);
  redemption = signal<any>(null);

  steps = [
    { n: 1, label: 'Vuelo' }, { n: 2, label: 'Destino' }, { n: 3, label: 'Hotel' },
    { n: 4, label: 'Actividades' }, { n: 5, label: 'Extras' }, { n: 6, label: 'Resumen' },
  ];

  extraOptions = [
    { type: 'TRASLADO_COMPLETO', label: '🚌 Traslados ida y vuelta', price: 80 },
    { type: 'SEGURO_VIAJE', label: '🛡️ Seguro de viaje', price: 45 },
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    public router: Router,
    private auth: AuthService,
  ) {}

  user() { return this.auth.currentUser(); }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.api.get<any>('loyalty/status').subscribe({ next: (s) => this.loyalty.set(s) });
    }
    const params = this.route.snapshot.queryParams;
    this.passengers.set(Number(params['passengers']) || 1);
    if (params['flightId']) {
      this.api.get<any>(`destinations/${params['destinationId']}/flights`, {
        departureDate: params['departureDate'], passengers: params['passengers'],
      }).subscribe(flights => {
        const f = (flights as any[]).find((fl: any) => fl.id == params['flightId']);
        if (f) this.flight.set(f);
      });
      // Load context
      const dep = params['departureDate'];
      const ret = new Date(dep); ret.setDate(ret.getDate() + 7);
      this.api.get<any>(`destinations/${params['destinationId']}/context`, {
        departureDate: dep, returnDate: ret.toISOString().split('T')[0],
      }).subscribe(ctx => { this.context.set(ctx); this.currentStep.set(2); });
    }
  }

  flightTotal() { return (this.flight()?.pricePerPerson ?? 0) * this.passengers(); }
  hotelNights() {
    if (!this.hotelCheckIn || !this.hotelCheckOut) return 0;
    return Math.max(1, Math.round((new Date(this.hotelCheckOut).getTime() - new Date(this.hotelCheckIn).getTime()) / 86400000));
  }
  hotelTotal() { return (this.selectedHotel()?.pricePerNight ?? 0) * Math.max(1, this.hotelNights()); }
  activitiesTotal() { return this.selectedActivities().reduce((s, a) => s + Number(a.price), 0); }
  extrasTotal() { return this.selectedExtras().reduce((s, e) => s + e.price, 0); }
  totalPrice() { return this.flightTotal() + this.hotelTotal() + this.activitiesTotal() + this.extrasTotal(); }
  // El descuento lo calcula el motor de fidelización del backend (AGENTS.md B7).
  pointsDiscount() { return Number(this.redemption()?.totalDiscount ?? 0); }

  onUsePointsChange(value: boolean) {
    this.usePoints = value;
    this.redemption.set(null);
    if (!value) return;
    this.api.post<any>('loyalty/redemption-preview', {
      packageTotal: this.totalPrice().toFixed(2),
      pointsToRedeem: this.loyalty()?.availablePoints ?? 0,
    }).subscribe({ next: (r) => this.redemption.set(r) });
  }

  toggleHotel(hotel: any) { this.selectedHotel.set(this.selectedHotel()?.id === hotel.id ? null : hotel); }
  toggleActivity(act: any) {
    const curr = this.selectedActivities();
    this.selectedActivities.set(curr.some(a => a.id === act.id) ? curr.filter(a => a.id !== act.id) : [...curr, act]);
  }
  isActivitySelected(id: number) { return this.selectedActivities().some(a => a.id === id); }
  toggleExtra(extra: any) {
    const curr = this.selectedExtras();
    this.selectedExtras.set(curr.some(e => e.type === extra.type) ? curr.filter(e => e.type !== extra.type) : [...curr, extra]);
  }
  isExtraSelected(type: string) { return this.selectedExtras().some(e => e.type === type); }

  confirmBooking() {
    this.loading.set(true);
    this.error.set('');
    const params = this.route.snapshot.queryParams;
    const body: any = {
      passengers: this.passengers(),
      pointsToRedeem: this.usePoints ? (this.loyalty()?.availablePoints ?? 0) : 0,
      flights: [{ flightId: Number(params['flightId']), priceSnapshot: this.flight()?.pricePerPerson ?? 0 }],
      hotels: this.selectedHotel() && this.hotelCheckIn && this.hotelCheckOut ? [{
        hotelId: this.selectedHotel().id,
        checkIn: this.hotelCheckIn, checkOut: this.hotelCheckOut,
        nights: this.hotelNights(), priceSnapshot: this.hotelTotal(),
      }] : [],
      activities: this.selectedActivities().map(a => ({ activityId: a.id, quantity: 1, priceSnapshot: Number(a.price) })),
      extras: this.selectedExtras().map(e => ({ type: e.type, price: e.price })),
    };
    this.api.post<any>('bookings', body).subscribe({
      next: (booking) => this.router.navigate(['/my-trips', booking.id]),
      error: (err) => { this.error.set(err.error?.message ?? 'Error al confirmar'); this.loading.set(false); },
    });
  }
}
