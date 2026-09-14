import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { CreateFlightDto } from './dto/create-flight.dto';
import { UpdateFlightStatusDto } from './dto/update-flight-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('flights')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlightsController {
  constructor(private service: FlightsService) {}

  @Get()
  @RequirePermission('flights:read')
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('routes')
  @RequirePermission('flights:read')
  findRoutes() { return this.service.findRoutes(); }

  @Get('gates')
  @RequirePermission('flights:read')
  findGates() { return this.service.findGates(); }

  @Get(':id')
  @RequirePermission('flights:read')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/manifest')
  @RequirePermission('flights:read')
  getManifest(@Param('id', ParseIntPipe) id: number) { return this.service.getManifest(id); }

  @Post()
  @RequirePermission('flights:create')
  create(@Body() dto: CreateFlightDto) { return this.service.create(dto); }

  @Put(':id')
  @RequirePermission('flights:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/status')
  @RequirePermission('flights:update')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFlightStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @RequirePermission('flights:delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
