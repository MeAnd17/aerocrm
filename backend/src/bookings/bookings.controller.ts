import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { OptionalJwtGuard } from './optional-jwt.guard';
import { NotAdminGuard } from '../auth/guards/not-admin.guard';

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

@ApiTags('Reservas — Admin')
@Controller('admin/bookings')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
@ApiForbiddenResponse({ description: 'Solo los administradores pueden acceder' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBookingsController {
  constructor(
    private bookingsService: BookingsService,
    private loyaltyService: LoyaltyService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las reservas con filtros y paginación (solo admin)' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por código, nombre o correo del cliente' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'Lista paginada de reservas' })
  findAllAdmin(
    @Query() query: {
      status?: BookingStatus;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return this.bookingsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle completo de cualquier reserva (solo admin)' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  findOneAdmin(@Param('id') id: string) {
    return this.bookingsService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambia el estado de una reserva (solo admin)',
    description:
      'Avanza el estado según las transiciones válidas del ciclo de vida. ' +
      'Si el nuevo estado es COMPLETADO, registra el viaje en el motor de fidelización.',
  })
  @ApiBadRequestResponse({ description: 'Transición de estado no válida' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  async cambiarEstadoAdmin(@Request() req, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    const reserva = await this.bookingsService.advanceStatus(id, dto.status, req.user.email);
    if (dto.status === BookingStatus.COMPLETADO) {
      await this.loyaltyService.onTripCompleted(reserva.clientId);
    }
    return reserva;
  }
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
  @UseGuards(OptionalJwtGuard, NotAdminGuard)
  @ApiOperation({
    summary: 'Cotiza un paquete (pública o autenticada, US-020)',
    description:
      'Calcula el precio total del paquete en el servidor a partir del catálogo. ' +
      'No crea ninguna reserva. Si se envía pointsToRedeem y el usuario está autenticado, ' +
      'aplica el descuento de canje completo incluyendo el bono por nivel de membresía.',
  })
  @ApiOkResponse({ description: 'Desglose de precios del paquete', type: QuoteResponseDto })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos, extra o actividad no disponible, o intento de enviar campos de precio' })
  @ApiNotFoundResponse({ description: 'Vuelo no encontrado o inactivo' })
  @ApiForbiddenResponse({ description: 'El administrador no puede usar rutas de cliente' })
  quote(@Body() dto: QuoteDto, @Request() req: { body: Record<string, unknown>; user?: { sub: number; role?: string } }) {
    // req.body contiene el cuerpo original tal como lo recibió Express, antes de transformación.
    return this.bookingsService.quote(dto, req.body ?? {}, req.user?.sub);
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
  @ApiForbiddenResponse({ description: 'El administrador no puede usar rutas de cliente' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
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
  @ApiForbiddenResponse({ description: 'El administrador no puede cancelar desde este endpoint' })
  @UseGuards(JwtAuthGuard, NotAdminGuard)
  @ApiOperation({
    summary: 'Cancela una reserva propia (US-018)',
    description: 'El cliente puede cancelar su reserva desde estado PENDIENTE o CONFIRMADO. En cualquier otro estado devuelve error.',
  })
  @ApiBadRequestResponse({ description: 'La reserva está en un estado que no permite cancelación' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  cancelOwn(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancelOwn(req.user.sub, id);
  }

  @Post(':id/pay')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @ApiForbiddenResponse({ description: 'El administrador no puede usar rutas de cliente' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: 'Paga una reserva PENDIENTE (pago simulado)',
    description: 'Confirma el pago de la reserva, la avanza a CONFIRMADO y registra los puntos de fidelización.',
  })
  @ApiBadRequestResponse({ description: 'La reserva no está en estado PENDIENTE o los puntos ya no son suficientes' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada o no pertenece al cliente' })
  pay(@Request() req, @Param('id') id: string, @Body() dto: PayBookingDto) {
    return this.bookingsService.pay(req.user.sub, id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden cambiar el estado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Avanza el estado de una reserva (solo admin)',
    description: 'Permite al administrador cambiar el estado siguiendo las transiciones válidas del ciclo de vida.',
  })
  @ApiBadRequestResponse({ description: 'Transición de estado no válida' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  advanceStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.advanceStatus(id, dto.status, req.user.email);
  }
}
