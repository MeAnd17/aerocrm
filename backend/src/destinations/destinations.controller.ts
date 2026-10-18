import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';

@ApiTags('Destinos y catálogo')
@Controller('destinations')
export class DestinationsController {
  constructor(private destinationsService: DestinationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista destinos activos con precio «desde» (no requiere sesión)',
    description: 'Cada destino incluye priceFrom: el precio del vuelo más barato que llega al destino con plazas disponibles y fecha futura, o null si no hay vuelos disponibles.',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['PLAYA', 'CIUDAD', 'AVENTURA', 'CULTURA'] })
  @ApiQuery({ name: 'search', required: false, description: 'Texto a buscar en nombre, ciudad o país' })
  findAll(@Query() query: any) {
    return this.destinationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle del destino con hoteles, actividades, festividades y vuelos de llegada',
    description: 'Incluye arrivingFlights: los 5 vuelos más baratos que llegan al destino con plazas disponibles y fecha futura, ordenados por precio. Si no hay ninguno, el arreglo viene vacío.',
  })
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
  @ApiOperation({ summary: 'Vuelos hacia el destino alrededor de una fecha', description: 'Devuelve los vuelos entre flexDays días antes y después de departureDate, ordenados por cercanía a esa fecha. Cada vuelo trae daysFromRequested.' })
  @ApiQuery({ name: 'origin', required: false, example: 'LIM', description: 'IATA de origen' })
  @ApiQuery({ name: 'departureDate', required: false, example: '2026-12-20' })
  @ApiQuery({ name: 'passengers', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'flexDays', required: false, type: Number, example: 3, description: 'Días de flexibilidad antes y después de la fecha (0 a 7). Por defecto 3' })
  searchFlights(
    @Param('id', ParseIntPipe) id: number,
    @Query('origin') origin: string,
    @Query('departureDate') departureDate: string,
    // Con transform activo, un número ausente llega como NaN y `??` no lo reemplaza: DefaultValuePipe sí.
    @Query('passengers', new DefaultValuePipe(1), ParseIntPipe) passengers: number,
    @Query('flexDays', new DefaultValuePipe(3), ParseIntPipe) flexDays: number,
  ) {
    return this.destinationsService.searchFlights(origin, id, departureDate, passengers, flexDays);
  }
}
