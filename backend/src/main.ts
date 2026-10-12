import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Catálogo de servicios (TS-015): única fuente sobre cómo responde el sistema (AGENTS.md F7).
  const config = new DocumentBuilder()
    .setTitle('AeroCRM API')
    .setDescription('Servicios de AeroCRM. Para probar los protegidos: POST /api/auth/login con un usuario de demostración, copia access_token y pégalo en Authorize.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`AeroCRM API en http://localhost:${port}/api · Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
