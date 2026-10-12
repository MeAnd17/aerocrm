import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Públicas ───────────────────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'explore',
    pathMatch: 'full',
  },
  {
    path: 'login',
    data: { fullBleed: true },
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'register',
    data: { fullBleed: true },
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'explore',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
  },

  // ── Privadas (requieren login) ────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
    canActivate: [authGuard],
  },
  {
    path: 'destinations/:id',
    loadComponent: () => import('./features/destinations/destination-detail.component').then(m => m.DestinationDetailComponent),
  },
  {
    // Abierto a visitantes (modo explorador, M2): la cuenta se pide recién al confirmar.
    path: 'packages/new',
    loadComponent: () => import('./features/packages/package-builder.component').then(m => m.PackageBuilderComponent),
  },
  {
    path: 'my-trips',
    loadComponent: () => import('./features/my-trips/my-trips.component').then(m => m.MyTripsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-trips/:id',
    loadComponent: () => import('./features/my-trips/trip-detail.component').then(m => m.TripDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'loyalty',
    loadComponent: () => import('./features/loyalty/loyalty.component').then(m => m.LoyaltyComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'explore' },
];
