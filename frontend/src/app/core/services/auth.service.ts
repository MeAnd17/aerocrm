import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'STAFF' | 'CLIENT';
  mustChangePassword: boolean;
  passengerId?: number;
  roles: string[];
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'aerocrm_token';
  private readonly USER_KEY  = 'aerocrm_user';

  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<{ access_token: string; user: AuthUser; mustChangePassword: boolean; userType: string }>(
      `${environment.apiUrl}/auth/login`, { email, password }
    ).pipe(tap(res => {
      localStorage.setItem(this.TOKEN_KEY, res.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
    }));
  }

  registerClient(data: any) {
    return this.http.post<{ access_token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/register`, data
    ).pipe(tap(res => {
      localStorage.setItem(this.TOKEN_KEY, res.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
    }));
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<{ access_token: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword }
    ).pipe(tap(res => {
      localStorage.setItem(this.TOKEN_KEY, res.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
    }));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/']);
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

  isClient(): boolean { return this.currentUser()?.userType === 'CLIENT'; }
  isStaff(): boolean  { return this.currentUser()?.userType === 'STAFF'; }
  mustChangePassword(): boolean { return this.currentUser()?.mustChangePassword === true; }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles?.includes('Admin')) return true;
    return user.permissions?.includes(permission) ?? false;
  }

  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  refreshMe() {
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }));
  }
}
