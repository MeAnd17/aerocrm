import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DestinationsService } from './destinations.service';
import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';

@ApiTags('Destinos y catálogo')
@Controller('extras')
export class ExtrasController {
  constructor(private destinationsService: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las opciones de extras del catálogo' })
  findAll() {
    return this.destinationsService.findAllExtras();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crea una opción de extra' })
  createExtra(@Body() dto: CreateExtraDto) {
    return this.destinationsService.createExtra(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualiza una opción de extra' })
  @ApiNotFoundResponse({ description: 'Extra no encontrado' })
  updateExtra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExtraDto,
  ) {
    return this.destinationsService.updateExtra(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactiva una opción de extra' })
  @ApiNotFoundResponse({ description: 'Extra no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar el extra' })
  deactivateExtra(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.deactivateExtra(id);
  }
}
