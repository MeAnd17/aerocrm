import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PackageDraftService } from '../../features/packages/package-draft.service';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  clientId: number | null;
  membershipLevel: string | null;
  availablePoints: number;
  completedTrips: number;
  role: string;
  mustChangePassword?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'viajes_token';
  private readonly USER_KEY  = 'viajes_user';

  private readonly draftService = inject(PackageDraftService);

  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<{ access_token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/login`, { email, password }
    ).pipe(tap(res => {
      localStorage.setItem(this.TOKEN_KEY, res.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
      this._sendSearchSignals();
      if (res.user.mustChangePassword) {
        this.router.navigate(['/profile/change-password']);
      }
    }));
  }

  register(data: any) {
    return this.http.post<{ access_token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/register`, data
    ).pipe(tap(res => {
      localStorage.setItem(this.TOKEN_KEY, res.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
      this._sendSearchSignals();
    }));
  }

  logout(skipNavigate = false) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    if (!skipNavigate) {
      this.router.navigate(['/explore']);
    }
  }

  /** Alias para compatibilidad con componentes heredados */
  registerClient(data: any) {
    return this.register(data);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch(
      `${environment.apiUrl}/auth/change-password`,
      { currentPassword, newPassword }
    );
  }

  /**
   * Compatibilidad con código heredado que usaba permisos granulares.
   * El sistema ahora usa roles (ADMIN / CLIENT); esta función siempre devuelve
   * true para no bloquear navegación mientras se migran los componentes del panel.
   */
  hasPermission(_permission: string): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  refreshMe() {
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }));
  }

  /**
   * Envía las señales de búsqueda acumuladas al backend para personalización (TS-010).
   * Se llama justo después de login o register exitosos. Las señales son no críticas:
   * si el envío falla, no se bloquea la sesión.
   */
  private _sendSearchSignals() {
    const signals = this.draftService.getSearchSignals();
    const hasSignals =
      signals.viewedDestinationTypes.length > 0 || signals.priceRangeFilter !== null;
    if (!hasSignals) return;
    this.http.patch(
      `${environment.apiUrl}/clients/me`,
      { searchSignals: signals },
    ).subscribe({ error: () => { /* señales no críticas: ignorar errores */ } });
  }

  private loadUser(): AuthUser | null {
    // Si el token venció, no se muestra una sesión que ya no existe.
    if (!this.isAuthenticated()) {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } catch { /* sin almacenamiento */ }
      return null;
    }
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
