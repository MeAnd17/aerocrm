import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { DestinationsModule } from './destinations/destinations.module';
import { BookingsModule } from './bookings/bookings.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ContactModule } from './contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    DestinationsModule,
    BookingsModule,
    LoyaltyModule,
    ContactModule,
    AdminModule,
    ReviewsModule,
    RecommendationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
