import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PackageBuilderState } from './package-builder.state';
import { ButtonComponent } from '../../shared/ui';
import { StepFlightComponent } from './steps/step-flight.component';
import { StepContextComponent } from './steps/step-context.component';
import { StepHotelComponent } from './steps/step-hotel.component';
import { StepActivitiesComponent } from './steps/step-activities.component';
import { StepExtrasComponent } from './steps/step-extras.component';
import { StepSummaryComponent } from './steps/step-summary.component';

/**
 * Contenedor del armador (TS-009): indicador de pasos, navegación y carga de datos.
 * Cada paso vive en steps/ y lo elegido vive en PackageBuilderState.
 */
@Component({
  selector: 'app-package-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    StepFlightComponent,
    StepContextComponent,
    StepHotelComponent,
    StepActivitiesComponent,
    StepExtrasComponent,
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
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center space-y-3">
          @if (destination()) {
            <p class="text-slate-700 font-medium">Arma tu viaje a {{ destination().city }}</p>
          } @else {
            <p class="text-slate-700 font-medium">Todavía no elegiste un vuelo.</p>
          }
          <p class="text-sm text-slate-500">El paquete se arma a partir del vuelo: búscalo y pulsa «Seleccionar».</p>
          <a [routerLink]="searchRoute()" [queryParams]="searchQueryParams()" uiButton variant="primary">Buscar vuelos</a>
        </div>
      }

      @if (state.step() >= 1 && state.flight()) {
        <app-step-flight />
      }

      @switch (state.step()) {
        @case (2) { @if (state.context()) { <app-step-context /> } }
        @case (3) { <app-step-hotel /> }
        @case (4) { <app-step-activities /> }
        @case (5) { <app-step-extras /> }
        @case (6) { <app-step-summary /> }
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

  /** Destino cargado cuando se entra sin vuelo (US-005 CA7). */
  readonly destination = signal<any>(null);

  readonly steps = [
    { n: 1, label: 'Vuelo' }, { n: 2, label: 'Destino' }, { n: 3, label: 'Hotel' },
    { n: 4, label: 'Actividades' }, { n: 5, label: 'Extras' }, { n: 6, label: 'Resumen' },
  ];

  /** Conserva el destino al volver al buscador público (US-005 CA7). */
  readonly searchQueryParams = computed(() => {
    const id = this.state.destinationId();
    return id ? { destinationId: id } : {};
  });

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.api.get<any>('loyalty/status').subscribe({ next: (s) => this.state.loyalty.set(s) });
    }
    const params = this.route.snapshot.queryParams;
    if (params['flightId']) {
      this.state.start({
        destinationId: Number(params['destinationId']),
        flightId: Number(params['flightId']),
        departureDate: params['departureDate'],
        passengers: Number(params['passengers']) || 1,
      });
      this.loadFlightAndContext();
    } else if (params['destinationId'] && !this.state.hasDraft()) {
      // Entró desde el detalle del destino sin vuelo todavía (US-005 CA7).
      this.state.destinationId.set(Number(params['destinationId']));
      this.loadDestination();
    } else if (this.state.hasDraft()) {
      // Continuar un paquete a medio armar (acceso desde la barra de navegación).
      this.loadFlightAndContext();
    }
  }

  /** El buscador con sesión vive en /search; sin sesión, en /explore. */
  searchRoute() {
    return this.auth.isAuthenticated() ? '/search' : '/explore';
  }

  back() {
    this.router.navigate([this.searchRoute()]);
  }

  /** Carga el destino cuando se entra sin vuelo (US-005 CA7). */
  private loadDestination() {
    this.api.get<any>(`destinations/${this.state.destinationId()}`).subscribe(d => this.destination.set(d));
  }

  private loadFlightAndContext() {
    const s = this.state;
    this.api.get<any>(`destinations/${s.destinationId()}/flights`, {
      departureDate: s.departureDate(), passengers: s.passengers(),
    }).subscribe((flights) => {
      const f = (flights as any[]).find((fl: any) => fl.id == s.flightId());
      if (f) s.flight.set(f);
    });
    const ret = new Date(s.departureDate());
    ret.setDate(ret.getDate() + 7);
    this.api.get<any>(`destinations/${s.destinationId()}/context`, {
      departureDate: s.departureDate(), returnDate: ret.toISOString().split('T')[0],
    }).subscribe((ctx) => {
      s.context.set(ctx);
      if (s.step() < 2) s.goTo(2);
    });
  }
}
