import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { Injectable, Logger } from "@nestjs/common";
import { WebSocketService } from "./websocket.service";

@WebSocketGateway({
  path: "/ws",
  transports: ["websocket"],
  cors: {
    origin: "*",
  },
})
@Injectable()
export class AppWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  handleConnection(client: WebSocket, req: Request): void {
    const clientId = this.webSocketService.generateClientId();
    this.webSocketService.addClient(client, clientId);
    this.webSocketService.sendConnectionSuccess(client, clientId);
  }

  handleDisconnect(client: WebSocket): void {
    this.webSocketService.removeClient(client);
  }

  @SubscribeMessage("ping")
  handlePing(client: WebSocket, data: any): void {
    this.webSocketService.sendPong(client, data);
  }
}