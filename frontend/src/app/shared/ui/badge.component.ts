import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-50 text-accent-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
};

/**
 * Etiqueta en píldora (TS-008), para estados y datos cortos:
 *   <ui-badge tone="success">Confirmado</ui-badge>
 *   <ui-badge tone="accent" [caps]="true">Paso 2</ui-badge>
 */
@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<ng-content />`,
  host: { '[class]': 'classes' },
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
  /** Mayúsculas con espaciado, para encabezados cortos como "PASO 1". */
  @Input() caps = false;

  get classes(): string {
    const text = this.caps ? 'text-[11px] font-bold uppercase tracking-wider' : 'text-xs font-semibold';
    return ['inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 whitespace-nowrap', text, TONES[this.tone]].join(' ');
  }
}
