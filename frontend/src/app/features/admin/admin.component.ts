import { Component, OnInit, signal } from '@angular/core';
import { CommonMódulo, DatePipe } from '@angular/common';
import { FormsMódulo } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

const MODULES = ['dashboard', 'passengers', 'flights', 'reservations', 'support', 'ai', 'admin'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonMódulo, FormsMódulo, DatePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Administración</h1>
        <p class="page-subtitle">Gestión de usuarios, roles y permisos</p>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="flex gap-1 mb-6 bg-navy-800 rounded-xl p-1 w-fit">
      <button *ngFor="let tab of tabs" (click)="activeTab.set(tab.id)"
              class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              [class.bg-navy-700]="activeTab() === tab.id"
              [class.text-white]="activeTab() === tab.id"
              [class.text-navy-400]="activeTab() !== tab.id">
        {{ tab.label }}
      </button>
    </div>

    <!-- ══════════════════ USERS TAB ══════════════════ -->
    <div *ngIf="activeTab() === 'usuarios'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="section-title mb-0">System Usuarios</h2>
        <button (click)="openUserModal()" class="btn-primary text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
          Nuevo Usuario
        </button>
      </div>

      <div class="aero-card overflow-hidden">
        <div *ngIf="loadingUsuarios()" class="p-6 space-y-3">
          <div *ngFor="let _ of [1,2,3,4,5]" class="skeleton h-14 rounded-lg"></div>
        </div>
        <table *ngIf="!loadingUsuarios()" class="aero-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios()">
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-semibold text-xs">
                    {{ u.firstName[0] }}{{ u.lastName[0] }}
                  </div>
                  <div>
                    <p class="font-medium text-white text-sm">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-xs text-navy-400">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let ur of u.userRoles" class="badge badge-navy text-xs">{{ ur.role?.name }}</span>
                  <span *ngIf="!u.userRoles?.length" class="text-xs text-navy-600">Sin roles</span>
                </div>
              </td>
              <td>
                <span class="badge text-xs" [class.badge-green]="u.isActivo" [class.badge-red]="!u.isActivo">
                  {{ u.isActivo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-xs text-navy-400">{{ u.lastLogin ? (u.lastLogin | date:'MMM d, HH:mm') : 'Nunca' }}</td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button (click)="openRoleAssignModal(u)" class="btn-icon" title="Asignar roles">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
                  </button>
                  <button (click)="toggleUserActivo(u)" class="btn-icon" [class.text-emerald-400]="!u.isActivo" [class.text-red-400]="u.isActivo" [title]="u.isActivo ? 'Desactivar' : 'Activar'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════ ROLES TAB ══════════════════ -->
    <div *ngIf="activeTab() === 'roles'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="section-title mb-0">Roles</h2>
        <button (click)="openRoleModal()" class="btn-primary text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
          Nuevo Rol
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let r of roles()" class="aero-card p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-semibold text-white">{{ r.name }}</h3>
              <p class="text-xs text-navy-400 mt-0.5">{{ r.description || 'Sin descripción' }}</p>
            </div>
            <div class="flex gap-1">
              <button (click)="openRoleModal(r)" class="btn-icon" title="Edit role">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37Z"/></svg>
              </button>
              <button (click)="deleteRole(r)" class="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete role">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V216a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,176H64V64H192Z"/></svg>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="text-navy-400"><span class="text-white font-semibold">{{ r._count?.userRoles || 0 }}</span> usuarios</span>
            <span class="text-navy-400"><span class="text-white font-semibold">{{ r._count?.rolePermissions || 0 }}</span> permisos</span>
          </div>
        </div>
        <div *ngIf="roles().length === 0 && !loadingRoles()" class="col-span-3 text-center text-navy-400 py-10">Sin roles defined</div>
      </div>
    </div>

    <!-- ══════════════════ PERMISSIONS TAB ══════════════════ -->
    <div *ngIf="activeTab() === 'permisos'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="section-title mb-0">Matriz de Permisos</h2>
        <select [(ngModel)]="selectedRoleId" (ngModelChange)="loadRolePermissions()" class="aero-input py-2 text-sm w-52">
          <option [value]="null">Select a role…</option>
          <option *ngFor="let r of roles()" [value]="r.id">{{ r.name }}</option>
        </select>
      </div>

      <div *ngIf="!selectedRoleId" class="aero-card p-10 text-center text-navy-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 text-navy-600" viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Z"/></svg>
        <p class="font-medium">Select a role to configure permisos</p>
      </div>

      <div *ngIf="selectedRoleId" class="aero-card overflow-hidden">
        <div class="p-4 border-b border-navy-700 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M243.84,76.31a4.08,4.08,0,0,0-.26-.45,16,16,0,0,0-21.4-5.84L168,101.84V72a16,16,0,0,0-16-16H40A16,16,0,0,0,24,72V184a16,16,0,0,0,16,16H152a16,16,0,0,0,16-16V154.16l54.18,31.82A16,16,0,0,0,244,172V84A4,4,0,0,0,243.84,76.31Z"/></svg>
          <p class="text-sm font-medium text-white">
            Configurando: <span class="text-gold-400">{{ getSelectedRoleName() }}</span>
          </p>
          <span class="text-xs text-navy-400 ml-auto">Click checkboxes to toggle permisos instantly</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-navy-700">
                <th class="text-left px-4 py-3 text-xs font-semibold text-navy-300 uppercase tracking-wider w-36">Módulo</th>
                <th *ngFor="let action of actions" class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                    [class.text-emerald-400]="action === 'read'"
                    [class.text-gold-400]="action === 'create'"
                    [class.text-blue-400]="action === 'update'"
                    [class.text-red-400]="action === 'delete'">
                  {{ action }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let mod of modules" class="border-b border-navy-800 hover:bg-navy-800/30 transition-colors">
                <td class="px-4 py-3">
                  <span class="font-medium text-white capitalize">{{ mod }}</span>
                </td>
                <td *ngFor="let action of actions" class="px-4 py-3 text-center">
                  <label class="inline-flex items-center justify-center cursor-pointer">
                    <input type="checkbox"
                           [checked]="hasPermission(mod, action)"
                           [disabled]="togglingPermission()"
                           (change)="togglePermission(mod, action, $event)"
                           class="w-4 h-4 accent-gold-500 cursor-pointer" />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════ USER MODAL ══════════════════ -->
    <div *ngIf="showUserModal()" class="modal-overlay" (click)="closeUserModal()">
      <div class="aero-card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h3 class="font-semibold text-white mb-4">{{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="aero-label">Nombres *</label>
              <input type="text" [(ngModel)]="userForm.firstName" minlength="2" maxlength="50" class="aero-input" placeholder="John" />
            </div>
            <div class="form-group">
              <label class="aero-label">Apellidos *</label>
              <input type="text" [(ngModel)]="userForm.lastName" minlength="2" maxlength="50" class="aero-input" placeholder="Doe" />
            </div>
          </div>
          <div class="form-group">
            <label class="aero-label">Correo electrónico *</label>
            <input type="email" [(ngModel)]="userForm.email" class="aero-input" placeholder="user@aerocrm.com" />
          </div>
          <div class="form-group">
            <label class="aero-label">DNI {{ editingUser ? '' : '*' }}</label>
            <input type="text" [(ngModel)]="userForm.dni" maxlength="20"
                   class="aero-input font-mono" style="text-transform:uppercase"
                   placeholder="e.g. 12345678A"
                   (input)="userForm.dni = userForm.dni?.toUpperCase()" />
            <p *ngIf="!editingUser" class="text-xs mt-1" style="color:#5580d0">
              El DNI será la contraseña temporal. El trabajador deberá cambiarla en su primer ingreso.
            </p>
          </div>
          <div *ngIf="editingUser" class="form-group">
            <label class="aero-label">Contraseña <span style="font-weight:400;color:#5580d0">(dejar en blanco para mantener la actual)</span></label>
            <input type="password" [(ngModel)]="userForm.password" minlength="8" class="aero-input" placeholder="Min 8 chars, 1 uppercase, 1 number" />
            <p *ngIf="userForm.password && !isContraseñaValid()" class="form-error mt-1">
              Contraseña needs: min 8 chars, at least 1 uppercase letter and 1 number
            </p>
          </div>
        </div>
        <div *ngIf="modalError()" class="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"/></svg>
          {{ modalError() }}
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="closeUserModal()" class="btn-ghost flex-1 justify-center">Cancelar</button>
          <button (click)="saveUser()" class="btn-primary flex-1 justify-center" [disabled]="savingUser() || (!editingUser && !isContraseñaValid() && !!userForm.password)">
            <svg *ngIf="savingUser()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {{ savingUser() ? 'Guardando…' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════ ROLE ASSIGN MODAL ══════════════════ -->
    <div *ngIf="showRoleAssignModal()" class="modal-overlay" (click)="showRoleAssignModal.set(false)">
      <div class="aero-card p-6 max-w-sm w-full" (click)="$event.stopPropagation()">
        <h3 class="font-semibold text-white mb-1">Asignar Roles</h3>
        <p class="text-xs text-navy-400 mb-4">{{ assignTarget()?.firstName }} {{ assignTarget()?.lastName }}</p>
        <div class="space-y-2">
          <label *ngFor="let r of roles()" class="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-700/50 cursor-pointer transition-colors">
            <input type="checkbox" [checked]="assignedRoleIds.includes(r.id)" (change)="toggleAssignRole(r.id, $event)" class="w-4 h-4 accent-gold-500" />
            <div>
              <p class="text-sm font-medium text-white">{{ r.name }}</p>
              <p class="text-xs text-navy-400">{{ r.description || 'Sin descripción' }}</p>
            </div>
          </label>
        </div>
        <p *ngIf="assignedRoleIds.length === 0" class="text-xs text-amber-400 mt-2">Debe asignarse al menos un rol</p>
        <div *ngIf="modalError()" class="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{{ modalError() }}</div>
        <div class="flex gap-3 mt-5">
          <button (click)="showRoleAssignModal.set(false)" class="btn-ghost flex-1 justify-center">Cancelar</button>
          <button (click)="saveRoleAssign()" class="btn-primary flex-1 justify-center" [disabled]="savingUser() || assignedRoleIds.length === 0">
            <svg *ngIf="savingUser()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            Guardar Roles
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════ ROLE MODAL ══════════════════ -->
    <div *ngIf="showRoleModal()" class="modal-overlay" (click)="closeRoleModal()">
      <div class="aero-card p-6 max-w-sm w-full" (click)="$event.stopPropagation()">
        <h3 class="font-semibold text-white mb-4">{{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="aero-label">Nombre del Rol *</label>
            <input type="text" [(ngModel)]="roleForm.name" class="aero-input" placeholder="e.g. Flight Supervisor" />
          </div>
          <div class="form-group">
            <label class="aero-label">Descripción</label>
            <input type="text" [(ngModel)]="roleForm.description" maxlength="200" class="aero-input" placeholder="Descripción breve de este rol…" />
          </div>
        </div>
        <div *ngIf="modalError()" class="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{{ modalError() }}</div>
        <div class="flex gap-3 mt-5">
          <button (click)="closeRoleModal()" class="btn-ghost flex-1 justify-center">Cancelar</button>
          <button (click)="saveRole()" class="btn-primary flex-1 justify-center" [disabled]="savingUser() || !roleForm.name?.trim()">
            <svg *ngIf="savingUser()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {{ savingUser() ? 'Guardando…' : (editingRole ? 'Guardar Cambios' : 'Create Role') }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  activeTab = signal('usuarios');
  tabs = [
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'roles', label: 'Roles' },
    { id: 'permisos', label: 'Matriz de Permisos' },
  ];

  usuarios = signal<any[]>([]);
  roles = signal<any[]>([]);
  permisos = signal<any[]>([]);
  loadingUsuarios = signal(true);
  loadingRoles = signal(true);

  modules = MODULES;
  actions = ACTIONS;

  // User modal
  showUserModal = signal(false);
  editingUser: any = null;
  userForm: any = { firstName: '', lastName: '', email: '', password: '' };
  savingUser = signal(false);
  modalError = signal('');

  // Role assign modal
  showRoleAssignModal = signal(false);
  assignTarget = signal<any>(null);
  assignedRoleIds: number[] = [];

  // Role modal
  showRoleModal = signal(false);
  editingRole: any = null;
  roleForm: any = { name: '', description: '' };

  // Permission matrix
  selectedRoleId: number | null = null;
  rolePermissionIds = new Set<number>();
  togglingPermission = signal(false);

  constructor(private api: ApiService, private toast: ToastService, public auth: AuthService) {}

  ngOnInit() {
    this.loadUsuarios();
    this.loadRoles();
    this.api.get<any[]>('admin/permisos').subscribe(p => this.permisos.set(p));
  }

  loadUsuarios() {
    this.loadingUsuarios.set(true);
    this.api.get<any[]>('admin/usuarios').subscribe({
      next: u => { this.usuarios.set(u); this.loadingUsuarios.set(false); },
      error: () => this.loadingUsuarios.set(false),
    });
  }

  loadRoles() {
    this.loadingRoles.set(true);
    this.api.get<any[]>('admin/roles').subscribe({
      next: r => { this.roles.set(r); this.loadingRoles.set(false); },
      error: () => this.loadingRoles.set(false),
    });
  }

  // ── Usuarios ──────────────────────────────────────────────────
  openUserModal(user?: any) {
    this.modalError.set('');
    this.editingUser = user || null;
    this.userForm = user
      ? { firstName: user.firstName, lastName: user.lastName, email: user.email, dni: user.dni || '', password: '' }
      : { firstName: '', lastName: '', email: '', dni: '', password: '' };
    this.showUserModal.set(true);
  }

  closeUserModal() { this.showUserModal.set(false); this.editingUser = null; }

  isContraseñaValid() {
    const p = this.userForm.password;
    if (!p) return true; // empty = keep current (edit mode)
    return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
  }

  saveUser() {
    const { firstName, lastName, email, password, dni } = this.userForm;
    if (!firstName?.trim() || firstName.length < 2) { this.modalError.set('El nombre debe tener al menos 2 caracteres'); return; }
    if (!lastName?.trim() || lastName.length < 2) { this.modalError.set('El apellido debe tener al menos 2 caracteres'); return; }
    if (!email?.trim()) { this.modalError.set('El correo es requerido'); return; }
    if (!this.editingUser && (!dni || dni.trim().length < 6)) { this.modalError.set('El DNI debe tener al menos 6 caracteres'); return; }
    if (password && !this.isContraseñaValid()) { this.modalError.set('Contraseña does not meet requirements'); return; }

    this.savingUser.set(true);
    this.modalError.set('');
    const payload: any = { firstName, lastName, email };
    if (dni) payload.dni = dni.trim().toUpperCase();
    if (password) payload.password = password;

    const req = this.editingUser
      ? this.api.put(`admin/usuarios/${this.editingUser.id}`, payload)
      : this.api.post('admin/usuarios', payload);

    req.subscribe({
      next: () => {
        this.toast.success(this.editingUser ? 'Usuario actualizado' : `Usuario creado — contraseña temporal es su DNI: ${payload.dni}`);
        this.closeUserModal();
        this.savingUser.set(false);
        this.loadUsuarios();
      },
      error: err => {
        this.savingUser.set(false);
        const msg = err?.error?.message;
        this.modalError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save user'));
      },
    });
  }

  toggleUserActivo(u: any) {
    this.api.put(`admin/usuarios/${u.id}`, { isActivo: !u.isActivo }).subscribe({
      next: () => { this.toast.success(`User ${u.isActivo ? 'deactivated' : 'activated'}`); this.loadUsuarios(); },
      error: err => this.toast.error(err?.error?.message || 'Failed'),
    });
  }

  openRoleAssignModal(u: any) {
    this.modalError.set('');
    this.assignTarget.set(u);
    this.assignedRoleIds = u.userRoles?.map((ur: any) => ur.roleId) || [];
    this.showRoleAssignModal.set(true);
  }

  toggleAssignRole(roleId: number, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) { if (!this.assignedRoleIds.includes(roleId)) this.assignedRoleIds = [...this.assignedRoleIds, roleId]; }
    else { this.assignedRoleIds = this.assignedRoleIds.filter(id => id !== roleId); }
  }

  saveRoleAssign() {
    if (this.assignedRoleIds.length === 0) { this.modalError.set('Debe asignarse al menos un rol'); return; }
    this.savingUser.set(true);
    this.api.post(`admin/usuarios/${this.assignTarget()?.id}/roles`, { roleIds: this.assignedRoleIds }).subscribe({
      next: () => {
        this.toast.success('Roles assigned successfully');
        this.showRoleAssignModal.set(false);
        this.savingUser.set(false);
        this.loadUsuarios();
      },
      error: err => {
        this.savingUser.set(false);
        this.modalError.set(err?.error?.message || 'Error al asignar roles');
      },
    });
  }

  // ── Roles ──────────────────────────────────────────────────
  openRoleModal(role?: any) {
    this.modalError.set('');
    this.editingRole = role || null;
    this.roleForm = role ? { name: role.name, description: role.description || '' } : { name: '', description: '' };
    this.showRoleModal.set(true);
  }

  closeRoleModal() { this.showRoleModal.set(false); this.editingRole = null; }

  saveRole() {
    if (!this.roleForm.name?.trim()) { this.modalError.set('El nombre del rol es requerido'); return; }
    this.savingUser.set(true);
    this.modalError.set('');
    const req = this.editingRole
      ? this.api.put(`admin/roles/${this.editingRole.id}`, this.roleForm)
      : this.api.post('admin/roles', this.roleForm);
    req.subscribe({
      next: () => {
        this.toast.success(this.editingRole ? 'Rol actualizado' : 'Rol creado');
        this.closeRoleModal();
        this.savingUser.set(false);
        this.loadRoles();
      },
      error: err => {
        this.savingUser.set(false);
        const msg = err?.error?.message;
        this.modalError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed'));
      },
    });
  }

  deleteRole(r: any) {
    if (r._count?.userRoles > 0) { this.toast.error(`No se puede eliminar "${r.name}" — ${r._count.userRoles} usuarios assigned. Reassign them first.`); return; }
    if (!confirm(`Delete role "${r.name}"?`)) return;
    this.api.delete(`admin/roles/${r.id}`).subscribe({
      next: () => { this.toast.success(`Role "${r.name}" deleted`); this.loadRoles(); },
      error: err => this.toast.error(err?.error?.message || 'Error al eliminar el rol'),
    });
  }

  // ── Permissions matrix ─────────────────────────────────────
  loadRolePermissions() {
    if (!this.selectedRoleId) return;
    const role = this.roles().find(r => r.id === +this.selectedRoleId!);
    if (!role) return;
    this.rolePermissionIds = new Set(role.rolePermissions?.map((rp: any) => rp.permissionId) || []);
  }

  getSelectedRoleName() {
    return this.roles().find(r => r.id === +this.selectedRoleId!)?.name || '';
  }

  hasPermission(mod: string, action: string): boolean {
    const perm = this.permisos().find(p => p.module === mod && p.action === action);
    if (!perm) return false;
    return this.rolePermissionIds.has(perm.id);
  }

  togglePermission(mod: string, action: string, event: Event) {
    const grant = (event.target as HTMLInputElement).checked;
    const perm = this.permisos().find(p => p.module === mod && p.action === action);
    if (!perm || !this.selectedRoleId) return;
    this.togglingPermission.set(true);
    this.api.patch(`admin/roles/${this.selectedRoleId}/permisos/${perm.id}`, { grant }).subscribe({
      next: () => {
        if (grant) this.rolePermissionIds.add(perm.id);
        else this.rolePermissionIds.delete(perm.id);
        this.togglingPermission.set(false);
        // Refresh roles to update counts
        this.loadRoles();
      },
      error: err => {
        this.togglingPermission.set(false);
        this.toast.error(err?.error?.message || 'Error al cambiar el permiso');
        // Revert checkbox
        (event.target as HTMLInputElement).checked = !grant;
      },
    });
  }
}
