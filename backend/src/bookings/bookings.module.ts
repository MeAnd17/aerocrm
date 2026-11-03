import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminBookingsController, BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SchedulerService } from './scheduler.service';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [ScheduleModule.forRoot(), LoyaltyModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService, SchedulerService],
  exports: [BookingsService],
})
export class BookingsModule {}
