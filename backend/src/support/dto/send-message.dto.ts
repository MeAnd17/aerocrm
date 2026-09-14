import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString() @MinLength(1, { message: 'Message cannot be empty' }) @MaxLength(2000)
  content: string;

  @IsOptional() @IsBoolean()
  isInternal?: boolean;
}
