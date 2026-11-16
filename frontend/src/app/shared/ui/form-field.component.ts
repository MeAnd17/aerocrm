import { Component, Directive, Input } from '@angular/core';

/**
 * Campo de formulario (TS-008): etiqueta, control, ayuda y error.
 *   <ui-field label="Correo" [error]="emailError">
 *     <input uiInput type="email" [(ngModel)]="email" />
 *   </ui-field>
 */
@Component({
  selector: 'ui-field',
  standalone: true,
  template: `
    <label class="block">
      @if (label) {
        <span class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">{{ label }}</span>
      }
      <ng-content />
    </label>
    @if (error) {
      <p class="text-xs text-red-600 mt-1">{{ error }}</p>
    } @else if (hint) {
      <p class="text-xs text-slate-500 mt-1">{{ hint }}</p>
    }
  `,
  host: { class: 'block' },
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
}

/** Estilo único de input, select y textarea. */
@Directive({
  selector: 'input[uiInput], select[uiInput], textarea[uiInput]',
  standalone: true,
  host: {
    class: 'w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:border-primary-700 focus:ring-[3px] focus:ring-primary-700/10 disabled:bg-slate-100',
  },
})
export class InputDirective {}
