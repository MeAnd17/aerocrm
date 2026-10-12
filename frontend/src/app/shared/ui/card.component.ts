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
      <h2 class="font-semibold text-slate-800 mb-3">{{ title }}</h2>
    }
    <ng-content />
  `,
  host: { class: 'block bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5' },
})
export class CardComponent {
  @Input() title = '';
}
