import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateAncillaryDto } from './dto/create-ancillary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReservationsController {
  constructor(private service: ReservationsService) {}

  @Get()
  @RequirePermission('reservations:read')
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('ancillaries/catalog')
  @RequirePermission('reservations:read')
  getCatalog() { return this.service.getCatalog(); }

  @Get(':id')
  @RequirePermission('reservations:read')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @RequirePermission('reservations:create')
  create(@Body() dto: CreateReservationDto) { return this.service.create(dto); }

  @Patch(':id/status')
  @RequirePermission('reservations:update')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.service.updateStatus(id, status);
  }

  @Post(':id/ancillaries')
  @RequirePermission('reservations:update')
  addAncillary(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAncillaryDto) {
    return this.service.addAncillary(id, dto);
  }

  @Delete(':id/ancillaries/:ancillaryId')
  @RequirePermission('reservations:update')
  cancelAncillary(
    @Param('id', ParseIntPipe) id: number,
    @Param('ancillaryId', ParseIntPipe) ancillaryId: number,
  ) { return this.service.cancelAncillary(id, ancillaryId); }
}
