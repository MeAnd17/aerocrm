import { Module } from '@nestjs/common';
import { DestinationsController } from './destinations.controller';
import { ExtrasController } from './extras.controller';
import { DestinationsService } from './destinations.service';

@Module({
  controllers: [DestinationsController, ExtrasController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
