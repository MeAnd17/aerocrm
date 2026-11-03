import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
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
  @ApiOperation({ summary: 'Devuelve todos los mensajes de contacto (solo administradores)' })
  @ApiOkResponse({ description: 'Lista paginada de mensajes' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactService.findAll({ page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20 });
  }
}
