import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', app: 'Viajes CRM API', timestamp: new Date().toISOString() };
  }
}
