// websocket/websocket.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { WebSocket } from "ws";
import { ConnectedClient, WebSocketMessage } from "./websocket.interface";
// import { ConnectedClient, WebSocketMessage } from "./interfaces/websocket.interface";

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private clients: Map<string, ConnectedClient> = new Map();

  addClient(client: WebSocket, clientId: string): void {
    this.clients.set(clientId, {
      ws: client,
      id: clientId,
      connectedAt: new Date(),
    });
    this.logger.log(`Client connected: ${clientId}`);
  }

  removeClient(client: WebSocket): void {
    const disconnectedClient = Array.from(this.clients.entries()).find(
      ([_, value]) => value.ws === client,
    );

    if (disconnectedClient) {
      const [clientId] = disconnectedClient;
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(this.formatMessage(event, data));
      return true;
    }
    return false;
  }

  broadcast(event: string, data: any): void {
    const message = this.formatMessage(event, data);

    this.clients.forEach((client) => {
      if (client.ws.readyState === client.ws.OPEN) {
        client.ws.send(message);
      }
    });
  }

  sendConnectionSuccess(client: WebSocket, clientId: string): void {
    client.send(
      this.formatMessage("connection", {
        status: "connected",
        clientId: clientId,
        message: "Successfully connected to WebSocket server",
      }),
    );
  }

  sendPong(client: WebSocket, data: any): void {
    client.send(this.formatMessage("pong", data));
  }

  private formatMessage(type: string, data: any): string {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(message);
  }

  generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
