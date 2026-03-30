import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  connectedAt: Date;
}

@WebSocketGateway({
  path: "/ws",
  transports: ["websocket"],
  cors: {
    origin: "*",
  },
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clients: Map<string, ConnectedClient> = new Map();

  handleConnection(client: WebSocket, req: Request) {
    const clientId = this.generateClientId();

    this.clients.set(clientId, {
      ws: client,
      id: clientId,
      connectedAt: new Date(),
    });

    this.logger.log(`Client connected: ${clientId}`);

    client.send(
      JSON.stringify({
        type: "connection",
        status: "connected",
        clientId: clientId,
        message: "Successfully connected to WebSocket server",
        timestamp: new Date().toISOString(),
      }),
    );
  }

  handleDisconnect(client: WebSocket) {
    const disconnectedClient = Array.from(this.clients.entries()).find(
      ([_, value]) => value.ws === client,
    );

    if (disconnectedClient) {
      const [clientId] = disconnectedClient;
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  @SubscribeMessage("ping")
  handlePing(client: WebSocket, data: any) {
    client.send(
      JSON.stringify({
        type: "pong",
        data: data,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  sendToClient(clientId: string, event: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(
        JSON.stringify({
          type: event,
          data: data,
          timestamp: new Date().toISOString(),
        }),
      );
      return true;
    }
    return false;
  }

  broadcast(event: string, data: any) {
    const message = JSON.stringify({
      type: event,
      data: data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  @OnEvent("betting.running")
  handleNewBetting(payload: any) {
    this.logger.log(`betting.running received`);
    this.broadcast("betting.running", payload);
  }

  @OnEvent("betting.crashed")
  handleGameCrashed(payload: any) {
    this.logger.log(`betting.crashed received`);
    this.broadcast("betting.crashed", payload);
  }

  @OnEvent("round.betting.started")
  handleNewRound(payload: any) {
    this.logger.log(`round.betting.started received`);
    this.broadcast("round.betting.started", payload);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
