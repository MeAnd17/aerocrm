import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PackageBuilderState } from './package-builder.state';
import { StepFlightComponent } from './steps/step-flight.component';
import { StepContextComponent } from './steps/step-context.component';
import { StepHotelComponent } from './steps/step-hotel.component';
import { StepActivitiesComponent } from './steps/step-activities.component';
import { StepExtrasComponent } from './steps/step-extras.component';
import { StepPassengersComponent } from './steps/step-passengers.component';
import { StepSummaryComponent } from './steps/step-summary.component';
import { StepPaymentComponent } from './steps/step-payment.component';
import { BadgeComponent, ButtonComponent } from '../../shared/ui';

/**
 * Contenedor del armador (TS-009, TS-010): indicador de pasos, navegación y carga de datos.
 * Cada paso vive en steps/ y lo elegido vive en PackageBuilderState.
 *
 * Cuando se recupera un draft del navegador (TS-010), solo hay IDs en memoria. Este
 * componente detecta esa situación (needsFlightReload) y carga los objetos completos del
 * servidor antes de mostrar el armador.
 */
@Component({
  selector: 'app-package-builder',
  standalone: true,
  imports: [
    CommonModule,
    StepFlightComponent,
    StepContextComponent,
    StepHotelComponent,
    StepActivitiesComponent,
    StepExtrasComponent,
    StepPassengersComponent,
    StepSummaryComponent,
    StepPaymentComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" uiButton variant="ghost" size="sm" class="-ml-3" (click)="back()">← Volver al buscador</button>
          <h1 class="mt-1 text-[28px] leading-9 sm:text-4xl sm:leading-[44px] font-bold tracking-tight text-primary-700">Arma tu paquete</h1>
        </div>
        @if (state.hasDraft()) {
          <ui-badge tone="accent" [caps]="true" class="self-start sm:self-auto">Paso {{ state.step() }} de {{ steps.length }}</ui-badge>
        }
      </div>

      <!-- Indicador de pasos -->
      <nav aria-label="Pasos del armador" class="sticky top-16 lg:top-[72px] z-20 -mx-4 border-y border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:mx-0 lg:rounded-2xl lg:border lg:shadow-card">
        <ol class="flex gap-2 overflow-x-auto">
          @for (s of steps; track s.n) {
            <li class="flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 pr-3.5 transition"
              [attr.aria-current]="state.step() === s.n ? 'step' : null"
              [ngClass]="state.step() === s.n
                ? 'border-accent-500 bg-accent-50'
                : state.step() > s.n ? 'border-transparent bg-primary-50' : 'border-transparent opacity-50'">
              <span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                [ngClass]="state.step() === s.n
                  ? 'bg-accent-600 text-white'
                  : state.step() > s.n ? 'bg-primary-700 text-success-200' : 'bg-slate-200 text-slate-500'">
                {{ state.step() > s.n ? '✓' : s.n }}
              </span>
              <span class="text-xs font-semibold"
                [ngClass]="state.step() === s.n ? 'text-accent-700' : state.step() > s.n ? 'text-primary-700' : 'text-slate-500'">{{ s.label }}</span>
            </li>
          }
        </ol>
      </nav>

      <div class="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div class="space-y-5" [ngClass]="showRail() ? 'lg:col-span-8' : 'lg:col-span-12'">
          @if (!state.hasDraft()) {
            <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-6 text-center space-y-3">
              <p class="text-slate-700 font-medium">Todavía no elegiste un vuelo.</p>
              <p class="text-sm text-slate-500">El paquete se arma a partir del vuelo: búscalo y pulsa «Seleccionar».</p>
              <button (click)="goToSearch()" class="inline-block bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-accent-700">Buscar vuelos</button>
            </div>
          }

          @if (state.hasDraft() && state.flight()) {
            @if (state.step() === 1) {
              <app-step-flight />
            } @else {
              <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-4 text-sm text-slate-600 space-y-1 lg:hidden">
                <p class="font-semibold text-slate-800 text-xs uppercase tracking-wide">Vuelos elegidos</p>
                <p>
                  ✈️ <span class="font-medium">Ida:</span>
                  {{ state.flight()?.origin?.city }} → {{ state.flight()?.destination?.city }}
                  · {{ state.flight()?.departureDate | date:'dd/MM/yyyy':'':'es-PE' }}
                </p>
                @if (state.returnFlight()) {
                  <p>
                    🔁 <span class="font-medium">Regreso:</span>
                    {{ state.returnFlight()?.origin?.city }} → {{ state.returnFlight()?.destination?.city }}
                    · {{ state.returnFlight()?.departureDate | date:'dd/MM/yyyy':'':'es-PE' }}
                  </p>
                }
              </div>
            }
          }

          @switch (state.step()) {
            @case (2) {
              @if (state.context()) { <app-step-context /> }
              @else { <p class="text-sm text-slate-400 text-center py-4">Cargando información del destino…</p> }
            }
            @case (3) { <app-step-hotel /> }
            @case (4) { <app-step-activities /> }
            @case (5) { <app-step-extras /> }
            @case (6) { <app-step-passengers /> }
            @case (7) { <app-step-summary /> }
            @case (8) { <app-step-payment /> }
          }
        </div>

        <!-- Resumen fijo del paquete: lo elegido hasta ahora (el total oficial se calcula en el paso Resumen). -->
        @if (showRail()) {
          <aside class="lg:col-span-4 lg:sticky lg:top-[152px]" aria-label="Tu paquete">
            <details class="group rounded-2xl border border-slate-200/80 bg-white/95 shadow-float backdrop-blur-md" [open]="railOpen">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 p-5 lg:cursor-default">
                <span>
                  <span class="block text-lg font-bold text-primary-700">Tu paquete</span>
                  <span class="block text-xs text-slate-500">{{ state.passengers() }} {{ state.passengers() === 1 ? 'pasajero' : 'pasajeros' }}</span>
                </span>
                <span class="text-slate-400 transition group-open:rotate-180 lg:hidden" aria-hidden="true">⌄</span>
              </summary>
              <ul class="space-y-4 border-t border-slate-100 px-5 py-4 text-sm">
                <li class="flex gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50" aria-hidden="true">✈️</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-primary-700">Vuelo de ida</span>
                    <span class="block text-xs text-slate-500">{{ state.flight()?.origin?.city }} → {{ state.flight()?.destination?.city }} · {{ state.flight()?.departureDate | date:'dd MMM':'':'es-PE' }}</span>
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50" aria-hidden="true">🔁</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-primary-700">Vuelo de regreso</span>
                    <span class="block text-xs text-slate-500">
                      @if (state.returnFlight(); as r) { {{ r.origin?.city }} → {{ r.destination?.city }} · {{ r.departureDate | date:'dd MMM':'':'es-PE' }} }
                      @else { Sin elegir }
                    </span>
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50" aria-hidden="true">🏨</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-primary-700">Hotel</span>
                    <span class="block text-xs text-slate-500">
                      @if (state.hotel(); as h) { {{ h.name }} · {{ state.hotelNights() }} {{ state.hotelNights() === 1 ? 'noche' : 'noches' }} }
                      @else { Sin elegir }
                    </span>
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50" aria-hidden="true">🧭</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-primary-700">Actividades</span>
                    <span class="block text-xs text-slate-500">{{ state.activitySelections().length ? state.activitySelections().length + ' elegida(s)' : 'Ninguna todavía' }}</span>
                  </span>
                </li>
                <li class="flex gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50" aria-hidden="true">🛡️</span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-primary-700">Extras</span>
                    <span class="block text-xs text-slate-500">{{ state.extraIds().length ? state.extraIds().length + ' elegido(s)' : 'Ninguno todavía' }}</span>
                  </span>
                </li>
              </ul>
              <div class="rounded-b-2xl border-t border-slate-100 bg-success-50/60 px-5 py-4">
                <p class="text-xs text-success-800">
                  <span class="font-semibold">✓ Sin cargos ocultos.</span>
                  El total oficial, con impuestos y canje de puntos, lo calculamos en el paso Resumen.
                </p>
              </div>
            </details>
          </aside>
        }
      </div>
    </div>
  `,
})
export class PackageBuilderComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly steps = [
    { n: 1, label: 'Vuelo' }, { n: 2, label: 'Destino' }, { n: 3, label: 'Hotel' },
    { n: 4, label: 'Actividades' }, { n: 5, label: 'Extras' },
    { n: 6, label: 'Pasajeros' }, { n: 7, label: 'Resumen' }, { n: 8, label: 'Pago' },
  ];

  /** El resumen lateral acompaña los pasos de elección; en Resumen y Pago ya está el desglose oficial. */
  showRail(): boolean {
    return this.state.hasDraft() && !!this.state.flight() && this.state.step() < 7;
  }

  /** En pantallas anchas el resumen se muestra abierto; en el teléfono empieza plegado. */
  readonly railOpen = typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches;

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.api.get<any>('loyalty/status').subscribe({ next: (s) => this.state.loyalty.set(s) });
    }
    const params = this.route.snapshot.queryParams;
    if (params['flightId']) {
      // Nuevo paquete: comienza desde el buscador con query params
      this.state.start({
        destinationId: Number(params['destinationId']),
        flightId: Number(params['flightId']),
        departureDate: params['departureDate'],
        passengers: Number(params['passengers']) || 1,
      });
      this._loadFlightAndContext();
    } else if (params['destinationId'] && !this.state.hasDraft()) {
      // Viene de una página de destino: guardar el destinationId para pre-filtrar el buscador.
      this.state.destinationId.set(Number(params['destinationId']));
    } else if (this.state.hasDraft()) {
      // Continuar un paquete a medio armar (acceso desde la barra de navegación).
      // Si el objeto completo no está en memoria (solo el ID del draft), recargarlo del servidor.
      this._loadFlightAndContext();
    }
  }

  /** El buscador vive en /explore (público) o /search (con sesión), con el destino pre-seleccionado si viene de un destino. */
  goToSearch() {
    const base = this.auth.isAuthenticated() ? '/search' : '/explore';
    const destId = this.state.destinationId();
    if (destId && !this.state.hasDraft()) {
      this.router.navigate([base], { queryParams: { destinationId: destId } });
    } else {
      this.router.navigate([base]);
    }
  }

  back() {
    this.goToSearch();
  }

  private _loadFlightAndContext() {
    const s = this.state;
    // Cargar vuelo completo del servidor (nunca se guarda en localStorage)
    this.api.get<any>(`destinations/${s.destinationId()}/flights`, {
      departureDate: s.departureDate(), passengers: s.passengers(),
    }).subscribe((flights) => {
      const f = (flights as any[]).find((fl: any) => fl.id == s.flightId());
      if (f) {
        s.flight.set(f);

        // Si hay un returnFlightId guardado en el draft, recargar el vuelo de regreso del servidor.
        // El regreso sale del destino hacia el origen.
        const savedReturnId = s.returnFlightId();
        if (savedReturnId && !s.returnFlight()) {
          const originId = f.origin?.id ?? s.destinationId();
          const returnOriginIata = f.destination?.iataCode;
          // Buscar entre los vuelos cuyo destino es el origen del viaje
          this.api.get<any[]>(`destinations/${originId}/flights`, {
            origin: returnOriginIata,
            departureDate: s.departureDate(),
            passengers: s.passengers(),
            flexDays: 7,
          }).subscribe((returnFlights) => {
            const rf = returnFlights.find((fl: any) => fl.id == savedReturnId);
            if (rf) s.returnFlight.set(rf);
          });
        }
      }
    });

    // Calcular fechas del viaje para el contexto
    // Si ya hay returnFlightId usamos 7 días como estimado; al cargarse el vuelo se puede recalcular.
    const ret = new Date(s.departureDate());
    ret.setDate(ret.getDate() + 7);
    this.api.get<any>(`destinations/${s.destinationId()}/context`, {
      departureDate: s.departureDate(), returnDate: ret.toISOString().split('T')[0],
    }).subscribe((ctx) => {
      s.context.set(ctx);
      // Si hay un hotelId guardado, restaurar el objeto completo del hotel desde el contexto
      const savedHotelId = s.hotelId();
      if (savedHotelId && !s.hotel()) {
        const hotelObj = (ctx.hotels ?? []).find((h: any) => h.id === savedHotelId);
        if (hotelObj) s.hotel.set(hotelObj);
      }
      // Si hay activitySelections guardadas, restaurar los objetos completos
      const savedSelections = s.activitySelections();
      if (savedSelections.length > 0 && s.activities().length === 0) {
        const restored = savedSelections
          .map(sel => (ctx.activities ?? []).find((a: any) => a.id === sel.activityId))
          .filter(Boolean);
        s.activities.set(restored);
      }
    });
  }
}
