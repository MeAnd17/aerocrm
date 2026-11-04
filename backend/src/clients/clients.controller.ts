import { Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';
import { AdminClientsQueryDto } from './dto/admin-clients-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Mi perfil' })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado' })
  @ApiForbiddenResponse({ description: 'El administrador no puede usar rutas de cliente' })
  getProfile(@Request() req) {
    return this.clientsService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Actualiza mi perfil y preferencias' })
  @ApiForbiddenResponse({ description: 'El administrador no puede usar rutas de cliente' })
  updateProfile(@Request() req, @Body() dto: UpdateClientDto) {
    return this.clientsService.updateProfile(req.user.sub, dto);
  }

  @Get('me/home')
  @ApiOperation({ summary: 'Inicio personalizado: próximo viaje, nivel, destinos guardados y festividades' })
  getHome(@Request() req) {
    return this.clientsService.getHome(req.user.sub);
  }

  @Get('me/travelers')
  @ApiOperation({ summary: 'Mis viajeros frecuentes' })
  getTravelers(@Request() req) {
    return this.clientsService.getTravelers(req.user.sub);
  }

  @Post('me/travelers')
  @ApiOperation({ summary: 'Guarda un viajero frecuente' })
  createTraveler(@Request() req, @Body() dto: CreateTravelerDto) {
    return this.clientsService.createTraveler(req.user.sub, dto);
  }

  @Delete('me/travelers/:id')
  @ApiOperation({ summary: 'Elimina un viajero frecuente' })
  @ApiNotFoundResponse({ description: 'Viajero no encontrado' })
  deleteTraveler(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.clientsService.deleteTraveler(req.user.sub, id);
  }

  @Patch('me/travelers/:id')
  @ApiOperation({ summary: 'Actualiza un viajero frecuente' })
  @ApiNotFoundResponse({ description: 'Viajero no encontrado' })
  updateTraveler(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTravelerDto) {
    return this.clientsService.updateTraveler(req.user.sub, id, dto);
  }

  @Post('me/saved-destinations/:destinationId')
  @ApiOperation({ summary: 'Guarda un destino como favorito' })
  saveDestination(@Request() req, @Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.clientsService.saveDestination(req.user.sub, destinationId);
  }

  @Delete('me/saved-destinations/:destinationId')
  @ApiOperation({ summary: 'Quita un destino de favoritos' })
  removeSavedDestination(@Request() req, @Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.clientsService.removeSavedDestination(req.user.sub, destinationId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lista clientes con su estado de fidelización' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  findAllAdmin(@Query() query: AdminClientsQueryDto) {
    return this.clientsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Perfil completo de un cliente con reservas e historial de puntos' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOneAdmin(id);
  }

  @Patch('admin/:id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Restablece la contraseña de un cliente y genera una temporal' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.resetPassword(id);
  }
}
