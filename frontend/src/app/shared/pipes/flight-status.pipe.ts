import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'flightStatusLabel', standalone: true })
export class FlightStatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    const labels: Record<string, string> = {
      ON_TIME: 'On Time', DELAYED: 'Delayed', CANCELLED: 'Cancelled',
      BOARDING: 'Boarding', DEPARTED: 'Departed', LANDED: 'Landed', DIVERTED: 'Diverted',
    };
    return labels[status] || status;
  }
}

@Pipe({ name: 'flightStatusClass', standalone: true })
export class FlightStatusClassPipe implements PipeTransform {
  transform(status: string): string {
    const classes: Record<string, string> = {
      ON_TIME: 'badge-green', DELAYED: 'badge-yellow', CANCELLED: 'badge-red',
      BOARDING: 'badge-purple', DEPARTED: 'badge-blue', LANDED: 'badge-gray', DIVERTED: 'badge-orange',
    };
    return classes[status] || 'badge-gray';
  }
}
