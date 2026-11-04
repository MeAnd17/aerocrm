import { Controller, Post, Get, Patch, Body, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ContactStatus, UserRole } from '@prisma/client';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { MarkAttendedDto } from './dto/mark-attended.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Contacto')
@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Envía una consulta a la agencia (no requiere sesión)' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve las consultas enviadas por el usuario autenticado' })
  @ApiOkResponse({ description: 'Lista de mensajes del usuario' })
  findMine(@CurrentUser('email') email: string) {
    return this.contactService.findMine(email);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve todos los mensajes de contacto paginados (solo administradores)' })
  @ApiOkResponse({ description: 'Lista paginada de mensajes con total' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  @ApiQuery({ name: 'status', enum: ContactStatus, required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 20)' })
  findAll(
    @Query('status') status?: ContactStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactService.findAll({
      status: status ?? undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Patch(':id/attend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marca una consulta como atendida y guarda la nota interna (solo administradores)' })
  @ApiOkResponse({ description: 'Consulta actualizada' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  markAttended(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkAttendedDto,
  ) {
    return this.contactService.markAttended(id, dto.note);
  }
}
