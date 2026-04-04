import { Test } from '@nestjs/testing';
import { AppWebSocketGateway } from './app-websocket.gateway';
import { WebSocketService } from './websocket.service';
import { WebSocket } from 'ws';

describe('AppWebSocketGateway', () => {
  let gateway: AppWebSocketGateway;

  const mockWebSocketService = {
    generateClientId: jest.fn(),
    addClient: jest.fn(),
    removeClient: jest.fn(),
    sendConnectionSuccess: jest.fn(),
    sendPong: jest.fn(),
  };

  const mockClient = {} as WebSocket;

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppWebSocketGateway,
        {
          provide: WebSocketService,
          useValue: mockWebSocketService,
        },
      ],
    }).compile();

    gateway = module.get(AppWebSocketGateway);

    jest.clearAllMocks();
  });


  describe('success scenarios', () => {
    it('should handle connection', () => {
      mockWebSocketService.generateClientId.mockReturnValue('client-123');

      gateway.handleConnection(mockClient, {} as any);

      expect(mockWebSocketService.generateClientId).toHaveBeenCalled();

      expect(mockWebSocketService.addClient).toHaveBeenCalledWith(
        mockClient,
        'client-123',
      );

      expect(mockWebSocketService.sendConnectionSuccess).toHaveBeenCalledWith(
        mockClient,
        'client-123',
      );
    });

    it('should handle disconnect', () => {
      gateway.handleDisconnect(mockClient);

      expect(mockWebSocketService.removeClient).toHaveBeenCalledWith(
        mockClient,
      );
    });

    it('should handle ping message', () => {
      const data = { hello: 'world' };

      gateway.handlePing(mockClient, data);

      expect(mockWebSocketService.sendPong).toHaveBeenCalledWith(
        mockClient,
        data,
      );
    });
  });

  describe('failure scenarios', () => {
    it('should throw if generateClientId fails', () => {
      mockWebSocketService.generateClientId.mockImplementation(() => {
        throw new Error('Failed to generate id');
      });

      expect(() =>
        gateway.handleConnection(mockClient, {} as any),
      ).toThrow('Failed to generate id');
    });

    it('should propagate error on removeClient failure', () => {
      mockWebSocketService.removeClient.mockImplementation(() => {
        throw new Error('Remove error');
      });

      expect(() =>
        gateway.handleDisconnect(mockClient),
      ).toThrow('Remove error');
    });

    it('should propagate error on sendPong failure', () => {
      mockWebSocketService.sendPong.mockImplementation(() => {
        throw new Error('Pong error');
      });

      expect(() =>
        gateway.handlePing(mockClient, {}),
      ).toThrow('Pong error');
    });
  });
});