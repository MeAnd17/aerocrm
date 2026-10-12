import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PackageBuilderState } from './package-builder.state';
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
        <div class="bg-white rounded-xl border shadow-sm p-6 text-center space-y-3">
          <p class="text-gray-700 font-medium">Todavía no elegiste un vuelo.</p>
          <p class="text-sm text-gray-500">El paquete se arma a partir del vuelo: búscalo y pulsa «Seleccionar».</p>
          <a [routerLink]="searchRoute()" class="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Buscar vuelos</a>
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

  readonly steps = [
    { n: 1, label: 'Vuelo' }, { n: 2, label: 'Destino' }, { n: 3, label: 'Hotel' },
    { n: 4, label: 'Actividades' }, { n: 5, label: 'Extras' }, { n: 6, label: 'Resumen' },
  ];

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
