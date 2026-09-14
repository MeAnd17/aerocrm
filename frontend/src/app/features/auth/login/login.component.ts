import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">

      <!-- Background image -->
      <div class="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80&auto=format&fit=crop"
          alt="Airport runway at night"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/85 to-navy-800/70"></div>
      </div>

      <!-- Decorative gold lines -->
      <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-gold-500/40 to-transparent z-10"></div>
      <div class="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-gold-500/20 to-transparent z-10"></div>

      <!-- Login card -->
      <div class="relative z-20 w-full max-w-md mx-4 animate-enter">

        <!-- Logo header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gold-500/10 border border-gold-500/30 rounded-2xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-gold-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">
            <span class="text-gold-400">Aero</span>CRM
          </h1>
          <p class="text-navy-300 mt-1 text-sm">Airline Operations Center</p>
        </div>

        <!-- Card -->
        <div class="aero-card p-8">
          <h2 class="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <!-- Error alert -->
          <div *ngIf="errorMsg()" class="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor">
              <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/>
            </svg>
            {{ errorMsg() }}
          </div>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>
            <!-- Email -->
            <div class="form-group">
              <label class="aero-label">Email address</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"/>
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  required
                  email
                  placeholder="operator@aerocrm.com"
                  class="aero-input pl-10"
                  [class.border-red-500]="emailField?.invalid && emailField?.touched"
                  #emailField="ngModel"
                />
              </div>
              <p *ngIf="emailField?.invalid && emailField?.touched" class="form-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/></svg>
                Enter a valid email address
              </p>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="aero-label">Password</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-68-56a12,12,0,1,1-12-12A12,12,0,0,1,140,152Z"/>
                  </svg>
                </span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  required
                  minlength="6"
                  placeholder="••••••••"
                  class="aero-input pl-10 pr-10"
                  [class.border-red-500]="pwField?.invalid && pwField?.touched"
                  #pwField="ngModel"
                />
                <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200 transition-colors">
                  <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"/></svg>
                  <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C(28,89.54,9.4,122.12,8.69,123.51a8,8,0,0,0,0,7c.35.79,8.82,19.57,27.65,38.4C61.43,193.74,93.12,207,128,207a117.22,117.22,0,0,0,52.06-11.87l22,24.25a8,8,0,1,0,11.84-10.76Zm47.33,75.84,41.67,45.85a32,32,0,0,1-41.67-45.85ZM128,191c-30.78,0-57.67-11.19-79.93-33.25A133.16,133.16,0,0,1,25.06,128c4.69-8.79,19.66-33.39,47.35-49.38L89,97.08a48.08,48.08,0,0,0,63,69.44l14.7,16.19A100.63,100.63,0,0,1,128,191Z"/></svg>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn-primary w-full justify-center py-3 mt-2 text-base"
              [disabled]="loading() || loginForm.invalid"
            >
              <svg *ngIf="loading()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <svg *ngIf="!loading()" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16h92.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM192,32H160a8,8,0,0,0,0,16h32V208H160a8,8,0,0,0,0,16h32a16,16,0,0,0,16-16V48A16,16,0,0,0,192,32Z"/></svg>
              {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <!-- Demo credentials -->
          <div class="mt-6 pt-5 border-t border-navy-700">
            <p class="text-xs text-navy-400 mb-3 font-medium uppercase tracking-wider">Demo Credentials</p>
            <div class="grid grid-cols-1 gap-2">
              <button *ngFor="let cred of demoCredentials" (click)="fillCredentials(cred)" class="text-left px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 hover:border-gold-500/50 transition-colors group">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gold-400">{{ cred.role }}</span>
                  <span class="text-xs text-navy-500 group-hover:text-navy-300 transition-colors">click to fill</span>
                </div>
                <span class="text-xs text-navy-400">{{ cred.email }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-navy-500 mt-6">AeroCRM v1.0 &mdash; Airline Operations Platform</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  demoCredentials = [
    { role: 'Administrator', email: 'admin@aerocrm.com', password: 'Admin1234!' },
    { role: 'Flight Agent', email: 'agent1@aerocrm.com', password: 'Agent1234!' },
    { role: 'Support Operator', email: 'support1@aerocrm.com', password: 'Support1234!' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  fillCredentials(cred: any) {
    this.email = cred.email;
    this.password = cred.password;
    this.errorMsg.set('');
  }

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message || 'Invalid email or password. Please try again.');
      },
    });
  }
}
