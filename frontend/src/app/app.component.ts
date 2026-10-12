import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavbarComponent } from './core/layout/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavbarComponent],
  template: `
    <app-navbar />
    @if (fullBleed()) {
      <router-outlet></router-outlet>
    } @else {
      <main class="mx-auto w-full max-w-6xl px-4 py-6">
        <router-outlet></router-outlet>
      </main>
    }
    <app-toast></app-toast>
  `,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Pantallas que ocupan todo el ancho (data: { fullBleed: true } en app.routes.ts). */
  readonly fullBleed = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      this.fullBleed.set(!!r.snapshot.data['fullBleed']);
    });
  }
}
