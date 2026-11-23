import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Botones en píldora, como en la maqueta. La acción principal es naranja (accent);
// la secundaria, borde gris con texto azul marino.
const BASE = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0';
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-600 text-white shadow-sm hover:bg-accent-700 hover:-translate-y-px focus-visible:ring-accent-500/25',
  secondary: 'bg-white text-primary-700 border-[1.5px] border-slate-300 hover:bg-slate-50 hover:border-primary-300 focus-visible:ring-primary-500/20',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-primary-700 focus-visible:ring-primary-500/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/25',
};
const SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

/**
 * Botón base (TS-008). Se usa sobre <button> o <a>:
 *   <button uiButton variant="primary" (click)="...">Guardar</button>
 *   <a uiButton variant="secondary" routerLink="/explore">Explorar</a>
 */
@Component({
  selector: 'button[uiButton], a[uiButton]',
  standalone: true,
  template: `<ng-content />`,
  host: { '[class]': 'classes' },
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() block = false;

  get classes(): string {
    return [BASE, VARIANTS[this.variant], SIZES[this.size], this.block ? 'w-full' : ''].join(' ');
  }
}
