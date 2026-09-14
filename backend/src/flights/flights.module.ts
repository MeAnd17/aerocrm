import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { FlightsGateway } from './flights.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '24h') },
      }),
    }),
  ],
  controllers: [FlightsController],
  providers: [FlightsService, FlightsGateway],
  exports: [FlightsService, FlightsGateway],
})
export class FlightsModule {}
