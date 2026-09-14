import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PassengersService } from './passengers.service';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { UpdatePassengerDto } from './dto/update-passenger.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('passengers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PassengersController {
  constructor(private service: PassengersService) {}

  @Get()
  @RequirePermission('passengers:read')
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id')
  @RequirePermission('passengers:read')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/profile-360')
  @RequirePermission('passengers:read')
  getProfile360(@Param('id', ParseIntPipe) id: number) { return this.service.getProfile360(id); }

  @Post()
  @RequirePermission('passengers:create')
  create(@Body() dto: CreatePassengerDto) { return this.service.create(dto); }

  @Put(':id')
  @RequirePermission('passengers:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePassengerDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @RequirePermission('passengers:delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
