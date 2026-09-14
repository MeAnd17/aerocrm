import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/flights' })
export class FlightsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private jwtService: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }
      this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });
      console.log(`WS client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  emitFlightStatusUpdate(payload: any) {
    this.server.emit('flight:status-updated', payload);
  }

  emitGateChange(payload: any) {
    this.server.emit('flight:gate-changed', payload);
  }

  emitDashboardActivity(payload: any) {
    this.server.emit('dashboard:activity', payload);
  }
}
