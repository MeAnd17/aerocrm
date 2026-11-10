import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtGuard } from '../bookings/optional-jwt.guard';
import { Recommendation, RecommendationsService } from './recommendations.service';
import {
  QuickPackageRequestDto,
  RecommendationsRequestDto,
} from './dto/recommendations-request.dto';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({
    summary: 'Obtener recomendaciones de destinos personalizadas (funciona con y sin sesión)',
  })
  @ApiResponse({ status: 200, description: 'Lista de hasta 6 destinos recomendados con razón' })
  getRecommendations(@Request() req: { user?: { clientId?: number } }, @Body() dto: RecommendationsRequestDto): Promise<Recommendation[]> {
    const clientId = req.user?.clientId ?? null;
    return this.recommendationsService.getRecommendations(clientId, dto);
  }

  @Post('quick-package')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({
    summary: 'Armar un draft de paquete rápido para un destino dado',
  })
  @ApiResponse({ status: 200, description: 'Draft con flightId, hotelId, activityIds y departureDate' })
  @ApiResponse({ status: 400, description: 'No hay vuelos disponibles para ese destino' })
  quickPackage(@Body() dto: QuickPackageRequestDto) {
    return this.recommendationsService.quickPackage(dto.destinationId);
  }
}
