import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Controller('support')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupportController {
  constructor(private service: SupportService) {}

  @Get('tickets')
  @RequirePermission('support:read')
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('tickets/stats')
  @RequirePermission('support:read')
  getStats() { return this.service.getStats(); }

  @Get('tickets/:id')
  @RequirePermission('support:read')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post('tickets')
  @RequirePermission('support:create')
  create(@Body() dto: CreateTicketDto) { return this.service.create(dto); }

  @Patch('tickets/:id/status')
  @RequirePermission('support:update')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: TicketStatus) {
    return this.service.updateStatus(id, status);
  }

  @Patch('tickets/:id/priority')
  @RequirePermission('support:update')
  updatePriority(@Param('id', ParseIntPipe) id: number, @Body('priority') priority: TicketPriority) {
    return this.service.updatePriority(id, priority);
  }

  @Patch('tickets/:id/assign')
  @RequirePermission('support:update')
  assign(@Param('id', ParseIntPipe) id: number, @Body('userId') userId: number) {
    return this.service.assign(id, Number(userId));
  }

  @Post('tickets/:id/messages')
  @RequirePermission('support:update')
  sendMessage(@Param('id', ParseIntPipe) id: number, @Body() dto: SendMessageDto, @Request() req: any) {
    return this.service.sendMessage(id, dto, req.user.sub);
  }

  @Post('simulate')
  @RequirePermission('support:create')
  simulate() { return this.service.simulate(); }
}
