import { Component, Input } from '@angular/core';

/**
 * Isotipo de AeroCRM (TS-008): cuadro azul marino con un avión y un sol naranja,
 * en la línea de la maqueta. <app-brand-mark /> o <app-brand-mark size="lg" />
 */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <svg [attr.width]="px" [attr.height]="px" viewBox="0 0 40 40" aria-hidden="true" class="block shrink-0">
      <rect width="40" height="40" rx="12" [attr.class]="onDark ? 'fill-white/10' : 'fill-primary-700'" />
      <circle cx="28.5" cy="12" r="4.5" class="fill-accent-500" />
      <path class="fill-white" d="M30.2 20.6c.9-.5.9-1.8 0-2.3-.4-.2-.9-.2-1.3 0l-5.4 2.6-8.3-5.2-2.3 1.1 5.6 5.6-4.8 2.3-2.8-1.6-1.8.9 3.1 3.6c.3.4.9.5 1.4.3l16.6-7.3z" />
      <path class="fill-white/30" d="M6 31.5c6-2.6 12.4-2.6 19 0s11 2.2 15-.5V40H6z" />
    </svg>
  `,
  host: { class: 'inline-flex' },
})
export class BrandMarkComponent {
  @Input() size: 'md' | 'lg' = 'md';
  /** Sobre fondo azul marino (pie de página) el cuadro se aclara para que no se pierda. */
  @Input() onDark = false;
  get px(): number {
    return this.size === 'lg' ? 44 : 36;
  }
}
