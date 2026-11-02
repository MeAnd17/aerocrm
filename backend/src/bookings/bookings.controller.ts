import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Forma de la respuesta de GET /bookings/extras */
class ExtraOptionDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'TRASLADO_IDA' }) type: string;
  @ApiProperty({ example: 'Traslado de ida al aeropuerto' }) name: string;
  @ApiProperty({ example: 'Traslado compartido al aeropuerto de salida.', required: false }) description?: string;
  @ApiProperty({ example: 60.00 }) price: number;
  @ApiProperty({ example: 'POR_RESERVA', enum: ['POR_RESERVA', 'POR_PASAJERO'] }) pricing: string;
  @ApiProperty({ example: 'PEN' }) currency: string;
}

@ApiTags('Reservas')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  /**
   * Endpoint público (sin autenticación): devuelve el desglose de precios
   * calculado por el servidor. No crea ninguna reserva.
   */
  @Post('quote')
  @ApiOperation({
    summary: 'Cotiza un paquete (sin autenticación)',
    description:
      'Calcula el precio total del paquete en el servidor a partir del catálogo. ' +
      'No crea ninguna reserva. Si se envía pointsToRedeem, aplica el descuento de canje.',
  })
  @ApiOkResponse({ description: 'Desglose de precios del paquete', type: QuoteResponseDto })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos, extra o actividad no disponible, o intento de enviar campos de precio' })
  @ApiNotFoundResponse({ description: 'Vuelo no encontrado o inactivo' })
  quote(@Body() dto: QuoteDto, @Request() req: { body?: Record<string, unknown> }) {
    // req.body contiene el cuerpo original tal como lo recibió Express, antes de transformación.
    return this.bookingsService.quote(dto, req.body ?? {});
  }

  @Get('extras')
  @ApiOperation({
    summary: 'Lista los extras disponibles del catálogo',
    description: 'Devuelve todos los extras activos (traslados, seguro de viaje) con precio y modo de cobro. No requiere autenticación.',
  })
  @ApiOkResponse({ description: 'Lista de extras activos', type: [ExtraOptionDto] })
  listExtras() {
    return this.bookingsService.listExtras();
  }

  @Get()
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mis reservas, paginadas' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  findAll(@Request() req, @Query() query: { status?: string; page?: number | string; limit?: number | string }) {
    return this.bookingsService.findAll(req.user.sub, query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalle de una reserva propia' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.bookingsService.findOne(req.user.sub, id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Compra un paquete (pago simulado)',
    description:
      'El servidor recalcula el precio desde el catálogo antes de crear la reserva. ' +
      'No se aceptan campos de precio en el cuerpo.',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos, canje menor a 500 puntos, puntos insuficientes o intento de enviar campos de precio' })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.sub, dto, req.body ?? {});
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancela una reserva propia' })
  @ApiBadRequestResponse({ description: 'La reserva ya está cancelada o completada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancel(req.user.sub, id);
  }
}
