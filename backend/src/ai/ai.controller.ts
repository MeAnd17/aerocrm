import { Controller, Post, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private service: AiService) {}

  @Get('health')
  checkHealth() { return this.service.checkHealth(); }

  @Post('analyze-ticket/:id')
  @RequirePermission('ai:create')
  analyzeTicket(@Param('id', ParseIntPipe) id: number) { return this.service.analyzeTicket(id); }

  @Get('analysis/:ticketId')
  @RequirePermission('ai:read')
  getAnalysis(@Param('ticketId', ParseIntPipe) ticketId: number) { return this.service.getLatestAnalysis(ticketId); }
}
