import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PriceRangeDto {
  @ApiProperty({ description: 'Precio mínimo en soles', example: 500 })
  @IsNumber()
  min: number;

  @ApiProperty({ description: 'Precio máximo en soles', example: 2000 })
  @IsNumber()
  max: number;
}

export class SearchSignalsDto {
  @ApiProperty({ description: 'Tipos de destino vistos durante la sesión', isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  viewedDestinationTypes: string[];

  @ApiPropertyOptional({ description: 'Rango de precio del último filtro aplicado', type: PriceRangeDto, nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRangeFilter: PriceRangeDto | null;
}

export class RecommendationsRequestDto {
  @ApiProperty({ description: 'Señales de búsqueda de la sesión' })
  @IsObject()
  @ValidateNested()
  @Type(() => SearchSignalsDto)
  searchSignals: SearchSignalsDto;
}

export class QuickPackageRequestDto {
  @ApiProperty({ description: 'ID del destino para el que armar el paquete rápido', example: 3 })
  @IsInt()
  destinationId: number;
}
