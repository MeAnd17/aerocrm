import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
const SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
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
