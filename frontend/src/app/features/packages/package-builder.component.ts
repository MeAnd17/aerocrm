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
  ],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <button (click)="back()" class="text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 class="text-2xl font-bold text-gray-800">Arma tu paquete</h1>
      </div>

      <!-- Indicador de pasos -->
      <div class="flex items-center gap-2">
        @for (s of steps; track s.n; let i = $index) {
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              [class.bg-blue-600]="state.step() >= s.n"
              [class.text-white]="state.step() >= s.n"
              [class.bg-gray-100]="state.step() < s.n"
              [class.text-gray-400]="state.step() < s.n">
              {{ s.n }}
            </div>
            <span class="text-xs hidden sm:block" [class.text-blue-600]="state.step() >= s.n" [class.text-gray-400]="state.step() < s.n">{{ s.label }}</span>
            @if (i < steps.length - 1) { <div class="w-4 h-0.5 bg-gray-200"></div> }
          </div>
        }
      </div>

      @if (!state.hasDraft()) {
        <div class="bg-white rounded-xl border shadow-sm p-6 text-center space-y-3">
          <p class="text-gray-700 font-medium">Todavía no elegiste un vuelo.</p>
          <p class="text-sm text-gray-500">El paquete se arma a partir del vuelo: búscalo y pulsa «Seleccionar».</p>
          <button (click)="goToSearch()" class="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Buscar vuelos</button>
        </div>
      }

      @if (state.hasDraft() && state.flight()) {
        @if (state.step() === 1) {
          <app-step-flight />
        } @else {
          <div class="bg-white rounded-xl border shadow-sm p-3 text-sm text-gray-600 space-y-1">
            <p class="font-semibold text-gray-800 text-xs uppercase tracking-wide">Vuelos elegidos</p>
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
          @else { <p class="text-sm text-gray-400 text-center py-4">Cargando información del destino…</p> }
        }
        @case (3) { <app-step-hotel /> }
        @case (4) { <app-step-activities /> }
        @case (5) { <app-step-extras /> }
        @case (6) { <app-step-passengers /> }
        @case (7) { <app-step-summary /> }
      }
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
    { n: 6, label: 'Pasajeros' }, { n: 7, label: 'Resumen' },
  ];

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
