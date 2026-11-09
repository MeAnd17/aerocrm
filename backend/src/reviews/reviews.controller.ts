import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotAdminGuard } from '../auth/guards/not-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, NotAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una calificación para una reserva completada' })
  @ApiResponse({ status: 201, description: 'Calificación creada correctamente' })
  @ApiResponse({ status: 400, description: 'Reserva no completada o ya calificada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  create(@CurrentUser('clientId') clientId: number, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(clientId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, NotAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar la calificación propia' })
  @ApiResponse({ status: 200, description: 'Calificación actualizada' })
  @ApiResponse({ status: 403, description: 'No puedes editar esta calificación' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  update(
    @CurrentUser('clientId') clientId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(clientId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, NotAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar la calificación propia' })
  @ApiResponse({ status: 200, description: 'Calificación eliminada' })
  @ApiResponse({ status: 403, description: 'No puedes eliminar esta calificación' })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada' })
  remove(@CurrentUser('clientId') clientId: number, @Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(clientId, id);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard, NotAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la calificación de una reserva propia (null si no existe)' })
  @ApiResponse({ status: 200, description: 'Calificación de la reserva o null' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  findByBooking(
    @CurrentUser('clientId') clientId: number,
    @Param('bookingId') bookingId: string,
  ) {
    return this.reviewsService.findByBooking(clientId, bookingId);
  }

  @Get('destination/:destinationId')
  @ApiOperation({ summary: 'Listar calificaciones de un destino (público)' })
  @ApiResponse({ status: 200, description: 'Promedio, conteo y lista de calificaciones' })
  findByDestination(@Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.reviewsService.findByDestination(destinationId);
  }
}
