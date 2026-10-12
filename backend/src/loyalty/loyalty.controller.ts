import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedemptionPreviewDto } from './dto/redemption-preview.dto';

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

  @Post('redemption-preview')
  @HttpCode(200)
  previewRedemption(@Request() req, @Body() dto: RedemptionPreviewDto) {
    return this.loyaltyService.previewRedemption(req.user.sub, dto);
  }
}
