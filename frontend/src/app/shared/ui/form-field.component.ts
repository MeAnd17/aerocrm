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
        <span class="block text-sm font-medium text-slate-700 mb-1">{{ label }}</span>
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
    class: 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100',
  },
})
export class InputDirective {}
