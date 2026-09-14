import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DestinationsService } from './destinations.service';

@Controller('destinations')
export class DestinationsController {
  constructor(private destinationsService: DestinationsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.destinationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOne(id);
  }

  @Get(':id/context')
  getContext(
    @Param('id', ParseIntPipe) id: number,
    @Query('departureDate') departureDate: string,
    @Query('returnDate') returnDate: string,
  ) {
    return this.destinationsService.getContext(id, departureDate, returnDate);
  }

  @Get(':id/flights')
  searchFlights(
    @Param('id', ParseIntPipe) id: number,
    @Query('origin') origin: string,
    @Query('departureDate') departureDate: string,
    @Query('passengers') passengers: number,
  ) {
    return this.destinationsService.searchFlights(origin, id, departureDate, passengers ?? 1);
  }
}
