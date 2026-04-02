import { WebSocket } from "ws";

export interface ConnectedClient {
  ws: WebSocket;
  id: string;
  connectedAt: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}