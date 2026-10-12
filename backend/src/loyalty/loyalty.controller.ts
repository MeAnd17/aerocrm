import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedemptionPreviewDto } from './dto/redemption-preview.dto';

@ApiTags('Fidelización')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('status')
  @ApiOperation({ summary: 'Nivel, puntos, valor de los puntos y avance al siguiente nivel' })
  getStatus(@Request() req) {
    return this.loyaltyService.getStatus(req.user.sub);
  }

  @Get('history')
  @ApiOperation({ summary: 'Últimos 50 movimientos de puntos' })
  getPointsHistory(@Request() req) {
    return this.loyaltyService.getPointsHistory(req.user.sub);
  }

  @Post('redemption-preview')
  @ApiOperation({ summary: 'Calcula el descuento de un canje sin registrarlo' })
  @ApiBadRequestResponse({ description: 'Canje menor a 500 puntos o puntos insuficientes' })
  @HttpCode(200)
  previewRedemption(@Request() req, @Body() dto: RedemptionPreviewDto) {
    return this.loyaltyService.previewRedemption(req.user.sub, dto);
  }
}
