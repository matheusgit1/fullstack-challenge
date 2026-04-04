import { WebSocketService } from './websocket.service';
import { WebSocket } from 'ws';

describe('WebsocketService', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as any;

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  const websocketServer = new WebSocketService();
  websocketServer.logger = logger;

  describe('sucess scenarios', () => {
    const client = {
      readyState: WebSocket.OPEN,
      OPEN: WebSocket.OPEN,
      on: (_event: string, _cb?: (data: any) => void) => {},
      send: (_data: any, _cb?: (err?: Error) => void) => {},
    } as WebSocket;

    it('should add client correctly', () => {
      const clientId = 'client-id';
      expect(websocketServer.addClient(client, clientId)).toBeUndefined();
    });

    it('should remove client correctly', () => {
      const client = {} as WebSocket;
      expect(websocketServer.removeClient(client)).toBeUndefined();
    });

    it('should send to client correctly if state OPEN', () => {
      const clientId = 'client-id';
      const event = 'event';
      const data = {};
      expect(websocketServer.sendToClient(clientId, event, data)).toBe(true);
    });

    it('should not send to client correctly if state not OPEN', () => {
      const clientClosed = {
        readyState: WebSocket.CLOSED,
        on: (_event: string, _cb?: (data: any) => void) => {},
        send: (_data: any, _cb?: (err?: Error) => void) => {},
      } as WebSocket;
      const data = {};
      expect(websocketServer.addClient(clientClosed, 'clientIdClosed')).toBeUndefined();
      expect(websocketServer.sendToClient('clientIdClosed', 'event', data)).toBe(false);
    });

    it('should broadcast correctly', () => {
      const event = 'event';
      const data = {};
      expect(websocketServer.broadcast(event, data)).toBeUndefined();
    });

    it('should generate client id correctly', () => {
      expect(websocketServer.generateClientId()).toBeDefined();
    });
  });
});
