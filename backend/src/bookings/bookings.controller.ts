import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reservas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis reservas, paginadas' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Request() req, @Query() query: any) {
    return this.bookingsService.findAll(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una reserva propia' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.bookingsService.findOne(req.user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Compra un paquete (pago simulado)', description: 'Calcula total, canje de puntos y puntos ganados con el motor de fidelización.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos, canje menor a 500 puntos o puntos insuficientes' })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.sub, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela una reserva propia' })
  @ApiBadRequestResponse({ description: 'La reserva ya está cancelada o completada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancel(req.user.sub, id);
  }
}
