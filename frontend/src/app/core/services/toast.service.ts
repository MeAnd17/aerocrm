import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: Toast['type'], message: string, title?: string) {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, type, message, title }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string, title = 'Listo') { this.show('success', message, title); }
  error(message: string, title = 'Error') { this.show('error', message, title); }
  warning(message: string, title = 'Aviso') { this.show('warning', message, title); }
  info(message: string, title = 'Información') { this.show('info', message, title); }

  dismiss(id: string) { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
