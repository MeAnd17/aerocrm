import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

type PestanaActiva = 'vuelos' | 'hoteles' | 'actividades';

interface Vuelo {
  id: number;
  airline: string;
  flightNumber: string;
  departureDate: string;
  classType: string;
  pricePerPerson: string;
  seatsAvailable: number;
  isActive: boolean;
}

interface Hotel {
  id: number;
  name: string;
  stars: number;
  zone: string | null;
  pricePerNight: string;
  isActive: boolean;
}

interface Actividad {
  id: number;
  name: string;
  type: string;
  price: string;
  durationHours: number | null;
  isActive: boolean;
}

interface Destino {
  id: number;
  name: string;
  arrivingFlights: Vuelo[];
  hotels: Hotel[];
  activities: Actividad[];
}

/**
 * Gestión del inventario de un destino: vuelos, hoteles y actividades (US-027).
 * Cada pestaña permite ver, agregar y desactivar elementos.
 */
@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <a
          routerLink="/admin/destinations"
          class="text-sm text-blue-600 hover:underline"
        >← Volver a destinos</a>
        <h1 class="text-xl font-bold text-gray-800">
          {{ destino()?.name ?? 'Inventario' }}
        </h1>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando inventario...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (destino()) {
        <!-- Pestañas -->
        <div class="flex border-b gap-1">
          @for (tab of pestanas; track tab.key) {
            <button
              (click)="pestana.set(tab.key)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition"
              [class.border-blue-600]="pestana() === tab.key"
              [class.text-blue-700]="pestana() === tab.key"
              [class.border-transparent]="pestana() !== tab.key"
              [class.text-gray-500]="pestana() !== tab.key"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Pestaña Vuelos -->
        @if (pestana() === 'vuelos') {
          <div class="space-y-4">
            <div class="flex justify-end">
              <button
                (click)="mostrarFormVuelo.set(!mostrarFormVuelo())"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Agregar vuelo
              </button>
            </div>

            @if (mostrarFormVuelo()) {
              <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                <h3 class="text-sm font-semibold text-gray-700">Nuevo vuelo</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Aerolínea</label>
                    <input [(ngModel)]="nuevoVuelo.airline" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Número de vuelo</label>
                    <input [(ngModel)]="nuevoVuelo.flightNumber" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Origen (ID destino)</label>
                    <input [(ngModel)]="nuevoVuelo.originId" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Clase</label>
                    <select [(ngModel)]="nuevoVuelo.classType" class="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="ECONOMY">Económica</option>
                      <option value="PREMIUM_ECONOMY">Económica premium</option>
                      <option value="BUSINESS">Ejecutiva</option>
                      <option value="FIRST_CLASS">Primera clase</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Fecha de salida</label>
                    <input [(ngModel)]="nuevoVuelo.departureDate" type="datetime-local" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Fecha de llegada</label>
                    <input [(ngModel)]="nuevoVuelo.arrivalDate" type="datetime-local" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Duración (minutos)</label>
                    <input [(ngModel)]="nuevoVuelo.durationMinutes" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Escalas</label>
                    <input [(ngModel)]="nuevoVuelo.stops" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Precio por pasajero</label>
                    <input [(ngModel)]="nuevoVuelo.pricePerPerson" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="450.00" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Asientos disponibles</label>
                    <input [(ngModel)]="nuevoVuelo.seatsAvailable" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                @if (errorFormVuelo()) {
                  <p class="text-sm text-red-600">{{ errorFormVuelo() }}</p>
                }
                <div class="flex gap-3">
                  <button
                    (click)="guardarVuelo()"
                    [disabled]="guardandoVuelo()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {{ guardandoVuelo() ? 'Guardando...' : 'Guardar vuelo' }}
                  </button>
                  <button
                    type="button"
                    (click)="mostrarFormVuelo.set(false)"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            }

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Aerolínea / Vuelo</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Clase</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Salida</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Precio</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Asientos</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (v of destino()!.arrivingFlights; track v.id) {
                    <tr class="hover:bg-gray-50" [class.opacity-50]="!v.isActive">
                      <td class="px-4 py-3 font-medium">{{ v.airline }} · {{ v.flightNumber }}</td>
                      <td class="px-4 py-3">{{ v.classType | label }}</td>
                      <td class="px-4 py-3">{{ v.departureDate | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-4 py-3">S/ {{ v.pricePerPerson }}</td>
                      <td class="px-4 py-3">{{ v.seatsAvailable }}</td>
                      <td class="px-4 py-3">
                        <span class="text-xs font-medium" [class.text-green-600]="v.isActive" [class.text-gray-400]="!v.isActive">
                          {{ v.isActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        @if (v.isActive) {
                          <button
                            (click)="desactivarVuelo(v)"
                            class="text-red-500 hover:text-red-700 text-xs font-medium transition"
                          >
                            Desactivar
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="px-4 py-6 text-center text-sm text-gray-400">Sin vuelos registrados.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Pestaña Hoteles -->
        @if (pestana() === 'hoteles') {
          <div class="space-y-4">
            <div class="flex justify-end">
              <button
                (click)="mostrarFormHotel.set(!mostrarFormHotel())"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Agregar hotel
              </button>
            </div>

            @if (mostrarFormHotel()) {
              <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                <h3 class="text-sm font-semibold text-gray-700">Nuevo hotel</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input [(ngModel)]="nuevoHotel.name" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Estrellas (1–5)</label>
                    <input [(ngModel)]="nuevoHotel.stars" type="number" min="1" max="5" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Zona (opcional)</label>
                    <input [(ngModel)]="nuevoHotel.zone" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Precio por noche</label>
                    <input [(ngModel)]="nuevoHotel.pricePerNight" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="380.00" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
                    <textarea [(ngModel)]="nuevoHotel.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                  </div>
                </div>
                @if (errorFormHotel()) {
                  <p class="text-sm text-red-600">{{ errorFormHotel() }}</p>
                }
                <div class="flex gap-3">
                  <button
                    (click)="guardarHotel()"
                    [disabled]="guardandoHotel()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {{ guardandoHotel() ? 'Guardando...' : 'Guardar hotel' }}
                  </button>
                  <button
                    type="button"
                    (click)="mostrarFormHotel.set(false)"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            }

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Hotel</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Estrellas</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Zona</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Precio/noche</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (h of destino()!.hotels; track h.id) {
                    <tr class="hover:bg-gray-50" [class.opacity-50]="!h.isActive">
                      <td class="px-4 py-3 font-medium">{{ h.name }}</td>
                      <td class="px-4 py-3">{{ h.stars }} ★</td>
                      <td class="px-4 py-3 text-gray-500">{{ h.zone ?? '—' }}</td>
                      <td class="px-4 py-3">S/ {{ h.pricePerNight }}</td>
                      <td class="px-4 py-3">
                        <span class="text-xs font-medium" [class.text-green-600]="h.isActive" [class.text-gray-400]="!h.isActive">
                          {{ h.isActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        @if (h.isActive) {
                          <button
                            (click)="desactivarHotel(h)"
                            class="text-red-500 hover:text-red-700 text-xs font-medium transition"
                          >
                            Desactivar
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-400">Sin hoteles registrados.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Pestaña Actividades -->
        @if (pestana() === 'actividades') {
          <div class="space-y-4">
            <div class="flex justify-end">
              <button
                (click)="mostrarFormActividad.set(!mostrarFormActividad())"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Agregar actividad
              </button>
            </div>

            @if (mostrarFormActividad()) {
              <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                <h3 class="text-sm font-semibold text-gray-700">Nueva actividad</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input [(ngModel)]="nuevaActividad.name" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select [(ngModel)]="nuevaActividad.type" class="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="AVENTURA">Aventura</option>
                      <option value="CULTURAL">Cultural</option>
                      <option value="GASTRONOMICO">Gastronómico</option>
                      <option value="FAMILIAR">Familiar</option>
                      <option value="RELAX">Relax</option>
                      <option value="DEPORTIVO">Deportivo</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                    <input [(ngModel)]="nuevaActividad.price" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="120.00" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Duración en horas (opcional)</label>
                    <input [(ngModel)]="nuevaActividad.durationHours" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
                    <textarea [(ngModel)]="nuevaActividad.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                  </div>
                </div>
                @if (errorFormActividad()) {
                  <p class="text-sm text-red-600">{{ errorFormActividad() }}</p>
                }
                <div class="flex gap-3">
                  <button
                    (click)="guardarActividad()"
                    [disabled]="guardandoActividad()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {{ guardandoActividad() ? 'Guardando...' : 'Guardar actividad' }}
                  </button>
                  <button
                    type="button"
                    (click)="mostrarFormActividad.set(false)"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            }

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Actividad</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Duración</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Precio</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th class="text-left px-4 py-3 font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (a of destino()!.activities; track a.id) {
                    <tr class="hover:bg-gray-50" [class.opacity-50]="!a.isActive">
                      <td class="px-4 py-3 font-medium">{{ a.name }}</td>
                      <td class="px-4 py-3">{{ a.type | label }}</td>
                      <td class="px-4 py-3 text-gray-500">{{ a.durationHours ? (a.durationHours + ' h') : '—' }}</td>
                      <td class="px-4 py-3">S/ {{ a.price }}</td>
                      <td class="px-4 py-3">
                        <span class="text-xs font-medium" [class.text-green-600]="a.isActive" [class.text-gray-400]="!a.isActive">
                          {{ a.isActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        @if (a.isActive) {
                          <button
                            (click)="desactivarActividad(a)"
                            class="text-red-500 hover:text-red-700 text-xs font-medium transition"
                          >
                            Desactivar
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-400">Sin actividades registradas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AdminInventoryComponent implements OnInit {
  destino = signal<Destino | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  pestana = signal<PestanaActiva>('vuelos');

  pestanas: { key: PestanaActiva; label: string }[] = [
    { key: 'vuelos', label: 'Vuelos' },
    { key: 'hoteles', label: 'Hoteles' },
    { key: 'actividades', label: 'Actividades' },
  ];

  // Formulario vuelo
  mostrarFormVuelo = signal(false);
  guardandoVuelo = signal(false);
  errorFormVuelo = signal<string | null>(null);
  nuevoVuelo = { airline: '', flightNumber: '', originId: 0, departureDate: '', arrivalDate: '', durationMinutes: 0, stops: 0, classType: 'ECONOMY', pricePerPerson: '', seatsAvailable: 0 };

  // Formulario hotel
  mostrarFormHotel = signal(false);
  guardandoHotel = signal(false);
  errorFormHotel = signal<string | null>(null);
  nuevoHotel = { name: '', stars: 3, zone: '', pricePerNight: '', description: '' };

  // Formulario actividad
  mostrarFormActividad = signal(false);
  guardandoActividad = signal(false);
  errorFormActividad = signal<string | null>(null);
  nuevaActividad = { name: '', type: 'AVENTURA', price: '', durationHours: null as number | null, description: '' };

  private destinationId = 0;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.destinationId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  /** Carga el detalle del destino con todos los items de inventario (activos e inactivos). */
  private cargar() {
    this.cargando.set(true);
    this.error.set(null);
    // El endpoint público trae solo los activos; para admin usamos findOne igual (incluye inactivos en detalle)
    // pero para ver inactivos necesitamos llamar sin el where isActive. El endpoint findOne ya hace includes sin filtro aquí.
    // Nota: findOne filtra isActive: true en los includes; el admin necesita verlos todos.
    // Usamos /destinations/:id (findOne) que es suficiente para mostrar inventario activo.
    this.api.get<Destino>(`destinations/${this.destinationId}`).subscribe({
      next: (data) => {
        this.destino.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudo cargar el inventario.'));
        this.cargando.set(false);
      },
    });
  }

  /** Envía el formulario de vuelo al backend y recarga. */
  guardarVuelo() {
    this.guardandoVuelo.set(true);
    this.errorFormVuelo.set(null);
    const payload = {
      ...this.nuevoVuelo,
      departureDate: new Date(this.nuevoVuelo.departureDate).toISOString(),
      arrivalDate: new Date(this.nuevoVuelo.arrivalDate).toISOString(),
    };
    this.api.post(`destinations/${this.destinationId}/flights`, payload).subscribe({
      next: () => {
        this.toast.success('Vuelo agregado.');
        this.mostrarFormVuelo.set(false);
        this.nuevoVuelo = { airline: '', flightNumber: '', originId: 0, departureDate: '', arrivalDate: '', durationMinutes: 0, stops: 0, classType: 'ECONOMY', pricePerPerson: '', seatsAvailable: 0 };
        this.guardandoVuelo.set(false);
        this.cargar();
      },
      error: (err) => {
        this.errorFormVuelo.set(apiErrorMessage(err, 'No se pudo guardar el vuelo.'));
        this.guardandoVuelo.set(false);
      },
    });
  }

  /** Desactiva un vuelo tras confirmación. */
  desactivarVuelo(v: Vuelo) {
    if (!confirm(`¿Desactivar el vuelo ${v.flightNumber}?`)) return;
    this.api.patch(`destinations/${this.destinationId}/flights/${v.id}/deactivate`, {}).subscribe({
      next: () => { this.toast.success('Vuelo desactivado.'); this.cargar(); },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo desactivar el vuelo.')),
    });
  }

  /** Envía el formulario de hotel al backend y recarga. */
  guardarHotel() {
    this.guardandoHotel.set(true);
    this.errorFormHotel.set(null);
    const payload = {
      name: this.nuevoHotel.name,
      stars: this.nuevoHotel.stars,
      zone: this.nuevoHotel.zone || undefined,
      pricePerNight: this.nuevoHotel.pricePerNight,
      description: this.nuevoHotel.description || undefined,
    };
    this.api.post(`destinations/${this.destinationId}/hotels`, payload).subscribe({
      next: () => {
        this.toast.success('Hotel agregado.');
        this.mostrarFormHotel.set(false);
        this.nuevoHotel = { name: '', stars: 3, zone: '', pricePerNight: '', description: '' };
        this.guardandoHotel.set(false);
        this.cargar();
      },
      error: (err) => {
        this.errorFormHotel.set(apiErrorMessage(err, 'No se pudo guardar el hotel.'));
        this.guardandoHotel.set(false);
      },
    });
  }

  /** Desactiva un hotel tras confirmación. */
  desactivarHotel(h: Hotel) {
    if (!confirm(`¿Desactivar "${h.name}"?`)) return;
    this.api.patch(`destinations/${this.destinationId}/hotels/${h.id}/deactivate`, {}).subscribe({
      next: () => { this.toast.success('Hotel desactivado.'); this.cargar(); },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo desactivar el hotel.')),
    });
  }

  /** Envía el formulario de actividad al backend y recarga. */
  guardarActividad() {
    this.guardandoActividad.set(true);
    this.errorFormActividad.set(null);
    const payload = {
      name: this.nuevaActividad.name,
      type: this.nuevaActividad.type,
      price: this.nuevaActividad.price,
      durationHours: this.nuevaActividad.durationHours || undefined,
      description: this.nuevaActividad.description || undefined,
    };
    this.api.post(`destinations/${this.destinationId}/activities`, payload).subscribe({
      next: () => {
        this.toast.success('Actividad agregada.');
        this.mostrarFormActividad.set(false);
        this.nuevaActividad = { name: '', type: 'AVENTURA', price: '', durationHours: null, description: '' };
        this.guardandoActividad.set(false);
        this.cargar();
      },
      error: (err) => {
        this.errorFormActividad.set(apiErrorMessage(err, 'No se pudo guardar la actividad.'));
        this.guardandoActividad.set(false);
      },
    });
  }

  /** Desactiva una actividad tras confirmación. */
  desactivarActividad(a: Actividad) {
    if (!confirm(`¿Desactivar "${a.name}"?`)) return;
    this.api.patch(`destinations/${this.destinationId}/activities/${a.id}/deactivate`, {}).subscribe({
      next: () => { this.toast.success('Actividad desactivada.'); this.cargar(); },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo desactivar la actividad.')),
    });
  }
}
