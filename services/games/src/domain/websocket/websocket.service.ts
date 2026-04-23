import { WebSocket } from 'ws';

export interface IWebSocketService {
  addClient(client: WebSocket, clientId: string): void;
  removeClient(client: WebSocket): void;
  sendToClient(clientId: string, event: string, data: any): boolean;
  broadcast(event: string, data?: any): void;
  sendConnectionSuccess(client: WebSocket, clientId: string): void;
  sendPong(client: WebSocket, data: any): void;
  generateClientId(): string;
}

export const WEB_SOCKET_SERVICE = Symbol('IWebSocketService');
