import { Component, Input } from '@angular/core';

/** Estado de carga (TS-008). <ui-loading text="Buscando vuelos..." /> */
@Component({
  selector: 'ui-loading',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-10 text-slate-500" role="status" aria-live="polite">
      <span class="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></span>
      <span class="text-sm">{{ text }}</span>
    </div>
  `,
})
export class LoadingStateComponent {
  @Input() text = 'Cargando...';
}
