import { INestApplication, ValidationPipe } from '@nestjs/common';
import { validationExceptionFactory } from './common/validation';
import { SpanishHttpMessagesFilter } from './common/http-messages.filter';

/**
 * Configuración común de la aplicación. La usan main.ts y las pruebas e2e,
 * para que las pruebas respondan exactamente igual que el servidor real.
 */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Mensajes de validación en español (AGENTS.md B9).
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new SpanishHttpMessagesFilter());

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
