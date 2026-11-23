import { Component, Input } from '@angular/core';

/**
 * Encabezado de pantalla (TS-008): antetítulo opcional, título, descripción y acciones a la derecha.
 *   <ui-page-header eyebrow="Mi cuenta" title="Mis viajes" subtitle="...">
 *     <a uiButton routerLink="/explore">Armar un viaje</a>
 *   </ui-page-header>
 */
@Component({
  selector: 'ui-page-header',
  standalone: true,
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        @if (eyebrow) {
          <p class="mb-1 text-[11px] font-bold uppercase tracking-wider text-accent-700">{{ eyebrow }}</p>
        }
        <h1 class="text-[28px] leading-9 sm:text-4xl sm:leading-[44px] font-bold tracking-tight text-primary-700">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-[15px] leading-relaxed text-slate-500 max-w-2xl">{{ subtitle }}</p>
        }
      </div>
      <div class="flex flex-wrap gap-2 shrink-0"><ng-content /></div>
    </div>
  `,
  host: { class: 'block' },
})
export class PageHeaderComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
