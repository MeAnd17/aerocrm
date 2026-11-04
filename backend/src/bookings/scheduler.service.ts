import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

/** Ejecuta el avance automático de reservas al arrancar y cada día a las 02:00. */
@Injectable()
export class SchedulerService {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Se ejecuta una vez al levantar la aplicación para sincronizar estados. */
  async onApplicationBootstrap() {
    await this.bookingsService.runDailyAdvance();
  }

  /** Se ejecuta todos los días a las 02:00 (hora local del servidor). */
  @Cron('0 2 * * *')
  async handleDailyAdvance() {
    await this.bookingsService.runDailyAdvance();
  }
}
