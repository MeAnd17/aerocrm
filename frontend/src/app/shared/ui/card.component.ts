import { Component, Input } from '@angular/core';

/**
 * Tarjeta base (TS-008).
 *   <ui-card title="Tu membresía"> ... </ui-card>
 */
@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    @if (title) {
      <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-3">{{ title }}</h2>
    }
    <ng-content />
  `,
  host: { class: 'block bg-white rounded-xl sm:rounded-2xl border border-slate-900/[0.06] shadow-card p-4 sm:p-6' },
})
export class CardComponent {
  @Input() title = '';
}
