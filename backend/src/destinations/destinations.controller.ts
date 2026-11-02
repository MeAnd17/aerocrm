import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { CreateFlightDto } from './dto/create-flight.dto';
import { UpdateFlightDto } from './dto/update-flight.dto';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@ApiTags('Destinos y catálogo')
@Controller('destinations')
export class DestinationsController {
  constructor(private destinationsService: DestinationsService) {}

  // ── Endpoints públicos ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lista destinos activos (no requiere sesión)' })
  @ApiQuery({ name: 'type', required: false, enum: ['PLAYA', 'CIUDAD', 'AVENTURA', 'CULTURA'] })
  @ApiQuery({ name: 'search', required: false, description: 'Texto a buscar en nombre, ciudad o país' })
  findAll(@Query() query: { type?: string; search?: string }) {
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

  // ── Endpoints de administración (US-027) ────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lista todos los destinos, incluidos los inactivos' })
  findAllAdmin() {
    return this.destinationsService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crea un destino nuevo' })
  createDestination(@Body() dto: CreateDestinationDto) {
    return this.destinationsService.createDestination(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualiza un destino' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  updateDestination(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationsService.updateDestination(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactiva un destino' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar porque ya forma parte de una reserva activa' })
  deactivateDestination(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.deactivateDestination(id);
  }

  @Post(':id/flights')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Agrega un vuelo al destino' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  createFlight(
    @Param('id', ParseIntPipe) destinationId: number,
    @Body() dto: CreateFlightDto,
  ) {
    return this.destinationsService.createFlight(destinationId, dto);
  }

  @Put(':id/flights/:fid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualiza un vuelo del destino' })
  @ApiNotFoundResponse({ description: 'Destino o vuelo no encontrado' })
  updateFlight(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('fid', ParseIntPipe) flightId: number,
    @Body() dto: UpdateFlightDto,
  ) {
    return this.destinationsService.updateFlight(destinationId, flightId, dto);
  }

  @Patch(':id/flights/:fid/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactiva un vuelo del destino' })
  @ApiNotFoundResponse({ description: 'Destino o vuelo no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar porque ya forma parte de una reserva activa' })
  deactivateFlight(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('fid', ParseIntPipe) flightId: number,
  ) {
    return this.destinationsService.deactivateFlight(destinationId, flightId);
  }

  @Post(':id/hotels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Agrega un hotel al destino' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  createHotel(
    @Param('id', ParseIntPipe) destinationId: number,
    @Body() dto: CreateHotelDto,
  ) {
    return this.destinationsService.createHotel(destinationId, dto);
  }

  @Put(':id/hotels/:hid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualiza un hotel del destino' })
  @ApiNotFoundResponse({ description: 'Destino o hotel no encontrado' })
  updateHotel(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('hid', ParseIntPipe) hotelId: number,
    @Body() dto: UpdateHotelDto,
  ) {
    return this.destinationsService.updateHotel(destinationId, hotelId, dto);
  }

  @Patch(':id/hotels/:hid/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactiva un hotel del destino' })
  @ApiNotFoundResponse({ description: 'Destino o hotel no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar porque ya forma parte de una reserva activa' })
  deactivateHotel(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('hid', ParseIntPipe) hotelId: number,
  ) {
    return this.destinationsService.deactivateHotel(destinationId, hotelId);
  }

  @Post(':id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Agrega una actividad al destino' })
  @ApiNotFoundResponse({ description: 'Destino no encontrado' })
  createActivity(
    @Param('id', ParseIntPipe) destinationId: number,
    @Body() dto: CreateActivityDto,
  ) {
    return this.destinationsService.createActivity(destinationId, dto);
  }

  @Put(':id/activities/:aid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualiza una actividad del destino' })
  @ApiNotFoundResponse({ description: 'Destino o actividad no encontrada' })
  updateActivity(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('aid', ParseIntPipe) activityId: number,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.destinationsService.updateActivity(destinationId, activityId, dto);
  }

  @Patch(':id/activities/:aid/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactiva una actividad del destino' })
  @ApiNotFoundResponse({ description: 'Destino o actividad no encontrada' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar porque ya forma parte de una reserva activa' })
  deactivateActivity(
    @Param('id', ParseIntPipe) destinationId: number,
    @Param('aid', ParseIntPipe) activityId: number,
  ) {
    return this.destinationsService.deactivateActivity(destinationId, activityId);
  }
}
