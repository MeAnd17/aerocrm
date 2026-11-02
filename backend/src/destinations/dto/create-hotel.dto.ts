import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';

/** Datos para agregar un hotel a un destino (US-027). */
export class CreateHotelDto {
  @ApiProperty({ example: 'Hotel Krystal Cancún' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @ApiPropertyOptional({ example: 'Zona Hotelera' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 'Hotel frente al mar con alberca infinita' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/hotel.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: '380.00', description: 'Precio por noche (string decimal)' })
  @IsNumberString()
  pricePerNight: string;
}
