import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  @RequirePermission('dashboard:read')
  getStats() { return this.service.getStats(); }

  @Get('flights-trend')
  @RequirePermission('dashboard:read')
  getFlightsTrend() { return this.service.getFlightsTrend(); }

  @Get('ancillary-breakdown')
  @RequirePermission('dashboard:read')
  getAncillaryBreakdown() { return this.service.getAncillaryBreakdown(); }

  @Get('sentiment-trend')
  @RequirePermission('dashboard:read')
  getSentimentTrend() { return this.service.getSentimentTrend(); }

  @Get('recent-activity')
  @RequirePermission('dashboard:read')
  getRecentActivity() { return this.service.getRecentActivity(); }

  @Get('upcoming-flights')
  @RequirePermission('dashboard:read')
  getUpcomingFlights() { return this.service.getUpcomingFlights(); }
}
