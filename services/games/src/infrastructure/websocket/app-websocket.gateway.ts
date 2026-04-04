import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { type IWebSocketService, WEB_SOCKET_SERVICE } from '@/domain/websocket/websocket.service';

@WebSocketGateway({
  path: '/ws',
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
})
@Injectable()
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    @Inject(WEB_SOCKET_SERVICE)
    private readonly webSocketService: IWebSocketService,
  ) {}

  handleConnection(client: WebSocket, req: Request): void {
    const clientId = this.webSocketService.generateClientId();
    this.webSocketService.addClient(client, clientId);
    this.webSocketService.sendConnectionSuccess(client, clientId);
  }

  handleDisconnect(client: WebSocket): void {
    this.webSocketService.removeClient(client);
  }

  @SubscribeMessage('ping')
  handlePing(client: WebSocket, data: any): void {
    this.webSocketService.sendPong(client, data);
  }
}
