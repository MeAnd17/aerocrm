import { Routes } from '@angular/router';
import { authGuard, adminGuard, clientOnlyGuard, noAuthGuard } from './core/guards/auth.guard';

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
    canActivate: [clientOnlyGuard],
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
    canActivate: [clientOnlyGuard],
  },

  // ── Privadas (requieren login) ────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'destinations',
        loadComponent: () => import('./features/admin/destinations/admin-destinations.component').then(m => m.AdminDestinationsComponent),
      },
      {
        path: 'destinations/:id/inventory',
        loadComponent: () => import('./features/admin/destinations/admin-inventory.component').then(m => m.AdminInventoryComponent),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/admin/bookings/admin-bookings.component').then(m => m.AdminBookingsComponent),
      },
      {
        path: 'bookings/:id',
        loadComponent: () => import('./features/admin/bookings/admin-booking-detail.component').then(m => m.AdminBookingDetailComponent),
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/admin/clients/admin-clients.component').then(m => m.AdminClientsComponent),
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/admin/clients/admin-client-detail.component').then(m => m.AdminClientDetailComponent),
      },
      {
        path: 'inquiries',
        loadComponent: () => import('./features/admin/contact/admin-contact.component').then(m => m.AdminContactComponent),
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
      },
    ],
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
    canActivate: [clientOnlyGuard],
  },
  {
    path: 'destinations',
    loadComponent: () => import('./features/destinations/destinations-list.component').then(m => m.DestinationsListComponent),
    canActivate: [clientOnlyGuard],
  },
  {
    path: 'destinations/:id',
    loadComponent: () => import('./features/destinations/destination-detail.component').then(m => m.DestinationDetailComponent),
    canActivate: [clientOnlyGuard],
  },
  {
    // Abierto a visitantes (modo explorador, M2): la cuenta se pide recién al confirmar.
    path: 'packages/new',
    loadComponent: () => import('./features/packages/package-builder.component').then(m => m.PackageBuilderComponent),
    canActivate: [clientOnlyGuard],
  },
  {
    path: 'my-trips',
    loadComponent: () => import('./features/my-trips/my-trips.component').then(m => m.MyTripsComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    // La ruta más específica debe ir antes de my-trips/:id para que el router no la interprete como un ID.
    path: 'my-trips/:id/print',
    loadComponent: () => import('./features/my-trips/trip-print.component').then(m => m.TripPrintComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    path: 'my-trips/:id',
    loadComponent: () => import('./features/my-trips/trip-detail.component').then(m => m.TripDetailComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    path: 'loyalty',
    loadComponent: () => import('./features/loyalty/loyalty.component').then(m => m.LoyaltyComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },
  {
    path: 'profile/change-password',
    loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard, clientOnlyGuard],
  },

  { path: '**', redirectTo: 'explore' },
];
