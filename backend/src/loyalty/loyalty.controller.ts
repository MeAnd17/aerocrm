import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('status')
  getStatus(@Request() req) {
    return this.loyaltyService.getStatus(req.user.sub);
  }

  @Get('history')
  getPointsHistory(@Request() req) {
    return this.loyaltyService.getPointsHistory(req.user.sub);
  }
}
