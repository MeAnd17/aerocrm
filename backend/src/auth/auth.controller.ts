import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Inicia sesión y devuelve el token JWT', description: 'Copia access_token y pégalo en el botón Authorize para probar los demás servicios.' })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registra un cliente con sus preferencias opcionales' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o correo ya registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente', schema: { example: { message: 'Contraseña actualizada' } } })
  @ApiBadRequestResponse({ description: 'Contraseña actual incorrecta, nueva igual a la actual, o no cumple los requisitos de fortaleza' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto);
  }
}
