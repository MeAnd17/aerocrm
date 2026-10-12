import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/**
 * Traduce los mensajes por defecto de Nest que llegan en inglés
 * ("Unauthorized", "Cannot GET /api/x", "Internal server error"...).
 * Los mensajes escritos en los servicios ya están en español y pasan sin cambios.
 */
const DEFAULT_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'La solicitud no es válida',
  [HttpStatus.UNAUTHORIZED]: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo',
  [HttpStatus.FORBIDDEN]: 'No tienes permiso para realizar esta acción',
  [HttpStatus.NOT_FOUND]: 'No encontramos lo que buscas',
  [HttpStatus.CONFLICT]: 'La operación entra en conflicto con datos existentes',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes. Intenta en unos segundos',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Ocurrió un error inesperado. Intenta de nuevo',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'El servicio no está disponible en este momento',
};

const ENGLISH_DEFAULT = /^(Unauthorized|Forbidden|Not Found|Bad Request|Conflict|Too Many Requests|Internal Server Error|Service Unavailable|Forbidden resource|Cannot (GET|POST|PUT|PATCH|DELETE) .*)$/i;

@Catch()
export class SpanishHttpMessagesFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // Error no controlado: se registra completo en el servidor y al cliente se le responde sin detalles.
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: DEFAULT_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR],
      });
      return;
    }

    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null) {
      const payload = { ...(body as Record<string, unknown>) };
      if (typeof payload.message === 'string' && ENGLISH_DEFAULT.test(payload.message)) {
        payload.message = DEFAULT_MESSAGES[status] ?? payload.message;
      }
      if (typeof payload.error === 'string' && DEFAULT_MESSAGES[status]) delete payload.error;
      res.status(status).json({ statusCode: status, ...payload });
      return;
    }

    const message = typeof body === 'string' && ENGLISH_DEFAULT.test(body) ? (DEFAULT_MESSAGES[status] ?? body) : body;
    res.status(status).json({ statusCode: status, message });
  }
}
