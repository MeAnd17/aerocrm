import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Estrellas de calificación (TS-008). Solo lectura por defecto; con [editable]="true" emite ratingChange.
 *   <ui-stars [rating]="4" />
 *   <ui-stars [rating]="nota" [editable]="true" (ratingChange)="nota = $event" />
 */
@Component({
  selector: 'ui-stars',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-0.5" [attr.aria-label]="rating + ' de 5 estrellas'" role="img">
      @for (n of stars; track n) {
        <button type="button" [disabled]="!editable" (click)="select(n)"
          class="text-lg leading-none disabled:cursor-default"
          [class.text-amber-400]="n <= rating" [class.text-slate-300]="n > rating"
          [attr.aria-label]="editable ? 'Calificar con ' + n : null">★</button>
      }
    </span>
  `,
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() editable = false;
  @Output() ratingChange = new EventEmitter<number>();
  readonly stars = [1, 2, 3, 4, 5];

  select(n: number) {
    if (!this.editable) return;
    this.rating = n;
    this.ratingChange.emit(n);
  }
}
