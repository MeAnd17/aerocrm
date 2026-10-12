import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';

@ApiTags('Destinos y catálogo')
@Controller('destinations')
export class DestinationsController {
  constructor(private destinationsService: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista destinos activos (no requiere sesión)' })
  @ApiQuery({ name: 'type', required: false, enum: ['PLAYA', 'CIUDAD', 'AVENTURA', 'CULTURA'] })
  @ApiQuery({ name: 'search', required: false, description: 'Texto a buscar en nombre, ciudad o país' })
  findAll(@Query() query: any) {
    return this.destinationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle del destino con hoteles, actividades y festividades' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOne(id);
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Contexto del viaje: clima, feriados y festividades entre dos fechas' })
  @ApiQuery({ name: 'departureDate', example: '2026-12-20' })
  @ApiQuery({ name: 'returnDate', example: '2026-12-27' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  getContext(
    @Param('id', ParseIntPipe) id: number,
    @Query('departureDate') departureDate: string,
    @Query('returnDate') returnDate: string,
  ) {
    return this.destinationsService.getContext(id, departureDate, returnDate);
  }

  @Get(':id/flights')
  @ApiOperation({ summary: 'Vuelos hacia el destino' })
  @ApiQuery({ name: 'origin', required: false, example: 'LIM', description: 'IATA de origen' })
  @ApiQuery({ name: 'departureDate', required: false, example: '2026-12-20' })
  @ApiQuery({ name: 'passengers', required: false, type: Number, example: 2 })
  searchFlights(
    @Param('id', ParseIntPipe) id: number,
    @Query('origin') origin: string,
    @Query('departureDate') departureDate: string,
    @Query('passengers') passengers: number,
  ) {
    return this.destinationsService.searchFlights(origin, id, departureDate, passengers ?? 1);
  }
}
