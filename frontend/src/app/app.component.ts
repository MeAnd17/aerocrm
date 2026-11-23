import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavbarComponent } from './core/layout/navbar/navbar.component';
import { FooterComponent } from './core/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />
    @if (fullBleed()) {
      <router-outlet></router-outlet>
    } @else {
      <main class="mx-auto w-full max-w-7xl px-4 py-6 lg:px-10 lg:py-10">
        <router-outlet></router-outlet>
      </main>
      <app-footer />
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
