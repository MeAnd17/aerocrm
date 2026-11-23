import { Component, Input } from '@angular/core';

/**
 * Estado vacío (TS-008). La acción va como contenido:
 *   <ui-empty-state icon="🧳" title="Aún no tienes viajes" message="Arma tu primer paquete.">
 *     <a uiButton routerLink="/explore">Explorar destinos</a>
 *   </ui-empty-state>
 */
@Component({
  selector: 'ui-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center text-center gap-2 py-10 px-4">
      <span class="text-4xl" aria-hidden="true">{{ icon }}</span>
      <p class="text-lg font-bold text-primary-700">{{ title }}</p>
      @if (message) {
        <p class="text-sm text-slate-500 max-w-sm">{{ message }}</p>
      }
      <div class="mt-3"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = '';
  @Input() message = '';
}
