import { Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me')
  getProfile(@Request() req) {
    return this.clientsService.getProfile(req.user.sub);
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() dto: UpdateClientDto) {
    return this.clientsService.updateProfile(req.user.sub, dto);
  }

  @Get('me/home')
  getHome(@Request() req) {
    return this.clientsService.getHome(req.user.sub);
  }

  @Get('me/travelers')
  getTravelers(@Request() req) {
    return this.clientsService.getTravelers(req.user.sub);
  }

  @Post('me/travelers')
  createTraveler(@Request() req, @Body() dto: CreateTravelerDto) {
    return this.clientsService.createTraveler(req.user.sub, dto);
  }

  @Delete('me/travelers/:id')
  deleteTraveler(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.clientsService.deleteTraveler(req.user.sub, id);
  }

  @Post('me/saved-destinations/:destinationId')
  saveDestination(@Request() req, @Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.clientsService.saveDestination(req.user.sub, destinationId);
  }

  @Delete('me/saved-destinations/:destinationId')
  removeSavedDestination(@Request() req, @Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.clientsService.removeSavedDestination(req.user.sub, destinationId);
  }
}
