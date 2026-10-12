import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error de la API en un texto para mostrar al usuario.
 * La API responde `message` como texto o como lista (validaciones); aquí se une en una sola línea.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && err.status === 0) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo';
  }
  const message = (err as { error?: { message?: unknown } })?.error?.message;
  if (Array.isArray(message) && message.length) return message.join('. ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}
