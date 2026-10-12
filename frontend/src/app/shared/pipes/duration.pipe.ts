import { Pipe, PipeTransform } from '@angular/core';

/** Minutos a texto legible: 330 → "5 h 30 min". */
@Pipe({ name: 'duracion', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes == null || minutes < 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
}
