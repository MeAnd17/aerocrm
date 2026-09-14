import { IsString, IsEnum, IsOptional, IsInt, Min, MinLength, MaxLength } from 'class-validator';
import { SupportChannel, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsOptional() @IsInt() @Min(1)
  passengerId?: number;

  @IsString() @MinLength(5, { message: 'Subject must be at least 5 characters' }) @MaxLength(200)
  subject: string;

  @IsEnum(SupportChannel, { message: 'Channel must be one of: WEB, EMAIL, WHATSAPP, PHONE, TWITTER' })
  channel: SupportChannel;

  @IsOptional() @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsString() @MinLength(10, { message: 'Message must be at least 10 characters' }) @MaxLength(2000)
  initialMessage: string;
}
