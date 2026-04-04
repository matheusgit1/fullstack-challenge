import { RabbitmqProducerService } from './rabbitmq.producer';
import * as amqp from 'amqplib';
import { rabbitConfig } from '@/configs/rabbitmq.config';
import {
  CashinMessage,
  CashoutMessage,
  CashReserveMessage,
  TransactionSource,
} from '@/domain/rabbitmq/rabbitmq.producer';

jest.mock('amqplib');
const mockAmqp = amqp as jest.Mocked<typeof amqp>;

jest.mock('@/configs/rabbitmq.config', () => ({
  rabbitConfig: {
    uri: 'amqp://localhost:5672',
    queue: 'test-queue',
  },
}));

describe('RabbitmqProducerService', () => {
  let rabbitmqProducer: RabbitmqProducerService;
  let mockChannel: any;
  let mockConnection: any;
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    rabbitmqProducer = new RabbitmqProducerService();
    rabbitmqProducer.logger = logger;
    rabbitmqProducer['channel'] = null;

    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockAmqp.connect.mockResolvedValue(mockConnection);
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    describe('connect', () => {
      it('should connect to RabbitMQ successfully', async () => {
        await rabbitmqProducer['connect']();

        expect(mockAmqp.connect).toHaveBeenCalledWith(rabbitConfig.uri);
        expect(mockConnection.createChannel).toHaveBeenCalled();
        expect(rabbitmqProducer['channel']).toBe(mockChannel);
        expect(logger.log).toHaveBeenCalledWith('Conectado ao RabbitMQ');
      });
    });

    describe('publishCashout', () => {
      const cashoutMessage: CashoutMessage = {
        cashType: TransactionSource.BET_LOST,
        userId: 'user-123',
        externalId: 'ext-456',
        tracingId: 'trace-789',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should publish cashout message successfully', async () => {
        await rabbitmqProducer.publishCashout(cashoutMessage);

        expect(mockAmqp.connect).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(rabbitConfig.queue, { durable: true });
        expect(mockChannel.sendToQueue).toHaveBeenCalled();

        const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1]);
        expect(sentMessage).toMatchObject({
          pattern: 'cash',
          data: {
            cashType: cashoutMessage.cashType,
            userId: cashoutMessage.userId,
            externalId: cashoutMessage.externalId,
            tracingId: cashoutMessage.tracingId,
          },
        });
        expect(sentMessage.data.timestamp).toBeDefined();

        expect(logger.log).toHaveBeenCalledWith(
          expect.stringContaining('BET_LOST message enviada para userId: user-123'),
          expect.objectContaining({
            externalId: cashoutMessage.externalId,
          }),
        );
      });

      it('should reuse existing connection if already connected', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer.publishCashout(cashoutMessage);

        expect(mockAmqp.connect).not.toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalled();
        expect(mockChannel.sendToQueue).toHaveBeenCalled();
      });

      it('should send message 3 times (repeat = 3)', async () => {
        await rabbitmqProducer.publishCashout(cashoutMessage);

        expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
      });

      it('should send message with persistent flag', async () => {
        await rabbitmqProducer.publishCashout(cashoutMessage);

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(rabbitConfig.queue, expect.any(Buffer), {
          persistent: true,
        });
      });
    });

    describe('publishCashin', () => {
      const cashinMessage: CashinMessage = {
        cashType: TransactionSource.BET_PLACED,
        userId: 'user-123',
        multiplier: 2.5,
        externalId: 'ext-456',
        tracingId: 'trace-789',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should publish cashin message successfully', async () => {
        await rabbitmqProducer.publishCashin(cashinMessage);

        expect(mockAmqp.connect).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(rabbitConfig.queue, { durable: true });
        expect(mockChannel.sendToQueue).toHaveBeenCalled();

        const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1]);
        expect(sentMessage).toMatchObject({
          pattern: 'cash',
          data: {
            cashType: cashinMessage.cashType,
            userId: cashinMessage.userId,
            multiplier: cashinMessage.multiplier,
            externalId: cashinMessage.externalId,
            tracingId: cashinMessage.tracingId,
          },
        });
        expect(sentMessage.data.timestamp).toBeDefined();

        expect(logger.log).toHaveBeenCalledWith(
          expect.stringContaining('BET_PLACED message enviada para userId: user-123'),
          expect.objectContaining({
            multiplier: cashinMessage.multiplier,
            externalId: cashinMessage.externalId,
          }),
        );
      });

      it('should reuse existing connection if already connected', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer.publishCashin(cashinMessage);

        expect(mockAmqp.connect).not.toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalled();
        expect(mockChannel.sendToQueue).toHaveBeenCalled();
      });

      it('should send message 3 times (repeat = 3)', async () => {
        await rabbitmqProducer.publishCashin(cashinMessage);

        expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
      });

      it('should send message with persistent flag', async () => {
        await rabbitmqProducer.publishCashin(cashinMessage);

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(rabbitConfig.queue, expect.any(Buffer), {
          persistent: true,
        });
      });
    });

    describe('publishReserve', () => {
      const reserveMessage: CashReserveMessage = {
        cashType: TransactionSource.BET_RESERVE,
        userId: 'user-123',
        amount: 1000,
        externalId: 'ext-456',
        tracingId: 'trace-789',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should publish reserve message successfully', async () => {
        await rabbitmqProducer.publishReserve(reserveMessage);

        expect(mockAmqp.connect).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(rabbitConfig.queue, { durable: true });
        expect(mockChannel.sendToQueue).toHaveBeenCalled();

        const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1]);
        expect(sentMessage).toMatchObject({
          pattern: 'cash',
          data: {
            cashType: TransactionSource.BET_RESERVE,
            userId: reserveMessage.userId,
            amount: reserveMessage.amount,
            externalId: reserveMessage.externalId,
            tracingId: reserveMessage.tracingId,
          },
        });
        expect(sentMessage.data.timestamp).toBeDefined();

        expect(logger.log).toHaveBeenCalledWith(
          expect.stringContaining('BET_RESERVE message enviada para userId: user-123'),
          expect.objectContaining({
            amount: reserveMessage.amount,
            externalId: reserveMessage.externalId,
          }),
        );
      });

      it('should reuse existing connection if already connected', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer.publishReserve(reserveMessage);

        expect(mockAmqp.connect).not.toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalled();
        expect(mockChannel.sendToQueue).toHaveBeenCalled();
      });

      it('should send message 3 times (repeat = 3)', async () => {
        await rabbitmqProducer.publishReserve(reserveMessage);

        expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
      });
    });

    describe('closeConnection', () => {
      it('should close channel connection if it exists', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer['closeConnection']();

        expect(mockChannel.close).toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith('Conexão com RabbitMQ fechada');
      });

      it('should not try to close channel if it does not exist', async () => {
        rabbitmqProducer['channel'] = null;

        await rabbitmqProducer['closeConnection']();

        expect(mockChannel.close).not.toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith('Conexão com RabbitMQ fechada');
      });
    });

    describe('sendMessage', () => {
      beforeEach(() => {
        rabbitmqProducer['channel'] = mockChannel;
      });

      it('should send message specified number of times', () => {
        const queue = 'test-queue';
        const message = { test: 'data' };
        const repeat = 5;

        rabbitmqProducer['sendMessage'](queue, message, repeat);

        expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(repeat);
      });

      it('should send message with persistent flag', () => {
        const queue = 'test-queue';
        const message = { test: 'data' };

        rabbitmqProducer['sendMessage'](queue, message, 1);

        expect(mockChannel.sendToQueue).toHaveBeenCalledWith(queue, expect.any(Buffer), { persistent: true });
      });

      it('should stringify message to Buffer', () => {
        const queue = 'test-queue';
        const message = { test: 'data', nested: { value: 123 } };

        rabbitmqProducer['sendMessage'](queue, message, 1);

        const buffer = mockChannel.sendToQueue.mock.calls[0][1];
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(JSON.parse(buffer.toString())).toEqual(message);
      });
    });
  });

  describe('Failure Scenarios', () => {
    describe('connect', () => {
      it('should throw error when connection fails', async () => {
        const connectionError = new Error('Failed to connect to RabbitMQ');
        mockAmqp.connect.mockRejectedValue(connectionError);

        await expect(rabbitmqProducer['connect']()).rejects.toThrow('Failed to connect to RabbitMQ');
        expect(logger.error).toHaveBeenCalledWith('Erro ao conectar ao RabbitMQ:');
        expect(logger.error).toHaveBeenCalledWith(connectionError);
        expect(rabbitmqProducer['channel']).toBeNull();
      });

      it('should throw error when creating channel fails', async () => {
        const channelError = new Error('Failed to create channel');
        mockConnection.createChannel.mockRejectedValue(channelError);

        await expect(rabbitmqProducer['connect']()).rejects.toThrow('Failed to create channel');
        expect(logger.error).toHaveBeenCalledWith('Erro ao conectar ao RabbitMQ:');
      });
    });

    describe('publishCashout', () => {
      const cashoutMessage: CashoutMessage = {
        cashType: TransactionSource.BET_LOST,
        userId: 'user-123',
        externalId: 'external-123',
        tracingId: 'tracing-123',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should handle connection error', async () => {
        const connectionError = new Error('Connection failed');
        mockAmqp.connect.mockRejectedValue(connectionError);

        await expect(rabbitmqProducer.publishCashout(cashoutMessage)).rejects.toThrow('Connection failed');
      });

      it('should handle queue assertion error', async () => {
        const queueError = new Error('Failed to assert queue');
        mockChannel.assertQueue.mockRejectedValue(queueError);

        await expect(rabbitmqProducer.publishCashout(cashoutMessage)).rejects.toThrow('Failed to assert queue');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_LOST message'),
          queueError,
        );
      });

      it('should handle sendToQueue error', async () => {
        const sendError = new Error('Failed to send message');
        mockChannel.sendToQueue.mockImplementation(() => {
          throw sendError;
        });

        await expect(rabbitmqProducer.publishCashout(cashoutMessage)).rejects.toThrow('Failed to send message');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_LOST message'),
          sendError,
        );
      });

      it('should attempt to connect if channel is null', async () => {
        rabbitmqProducer['channel'] = null;

        await rabbitmqProducer.publishCashout(cashoutMessage);

        expect(mockAmqp.connect).toHaveBeenCalled();
        expect(mockChannel.assertQueue).toHaveBeenCalled();
      });
    });

    describe('publishCashin', () => {
      const cashinMessage: CashinMessage = {
        cashType: TransactionSource.BET_PLACED,
        userId: 'user-123',
        multiplier: 2.5,
        externalId: 'ext-456',
        tracingId: 'trace-789',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should handle connection error', async () => {
        const connectionError = new Error('Connection failed');
        mockAmqp.connect.mockRejectedValue(connectionError);

        await expect(rabbitmqProducer.publishCashin(cashinMessage)).rejects.toThrow('Connection failed');
      });

      it('should handle queue assertion error', async () => {
        const queueError = new Error('Failed to assert queue');
        mockChannel.assertQueue.mockRejectedValue(queueError);

        await expect(rabbitmqProducer.publishCashin(cashinMessage)).rejects.toThrow('Failed to assert queue');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_PLACED message'),
          queueError,
        );
      });

      it('should handle sendToQueue error', async () => {
        const sendError = new Error('Failed to send message');
        mockChannel.sendToQueue.mockImplementation(() => {
          throw sendError;
        });

        await expect(rabbitmqProducer.publishCashin(cashinMessage)).rejects.toThrow('Failed to send message');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_PLACED message'),
          sendError,
        );
      });
    });

    describe('publishReserve', () => {
      const reserveMessage: CashReserveMessage = {
        cashType: TransactionSource.BET_RESERVE,
        userId: 'user-123',
        amount: 1000,
        externalId: 'ext-456',
        tracingId: 'trace-789',
        timestamp: '2023-08-01T12:34:56.789Z',
      };

      it('should handle connection error', async () => {
        const connectionError = new Error('Connection failed');
        mockAmqp.connect.mockRejectedValue(connectionError);

        await expect(rabbitmqProducer.publishReserve(reserveMessage)).rejects.toThrow('Connection failed');
      });

      it('should handle queue assertion error', async () => {
        const queueError = new Error('Failed to assert queue');
        mockChannel.assertQueue.mockRejectedValue(queueError);

        await expect(rabbitmqProducer.publishReserve(reserveMessage)).rejects.toThrow('Failed to assert queue');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_RESERVE message'),
          queueError,
        );
      });

      it('should handle sendToQueue error', async () => {
        const sendError = new Error('Failed to send message');
        mockChannel.sendToQueue.mockImplementation(() => {
          throw sendError;
        });

        await expect(rabbitmqProducer.publishReserve(reserveMessage)).rejects.toThrow('Failed to send message');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro ao enviar BET_RESERVE message'),
          sendError,
        );
      });
    });

    describe('sendMessage', () => {
      beforeEach(() => {
        rabbitmqProducer['channel'] = mockChannel;
      });

      it('should throw error when channel is null', () => {
        rabbitmqProducer['channel'] = null;

        expect(() => {
          rabbitmqProducer['sendMessage']('queue', {}, 1);
        }).toThrow();
      });

      it('should throw error when sendToQueue fails', () => {
        const sendError = new Error('Send failed');
        mockChannel.sendToQueue.mockImplementation(() => {
          throw sendError;
        });

        expect(() => {
          rabbitmqProducer['sendMessage']('queue', {}, 1);
        }).toThrow('Send failed');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty message data', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer.publishCashout({
          cashType: TransactionSource.BET_LOST,
          userId: '',
          externalId: '',
          tracingId: 'trace-789',
          timestamp: '2023-08-01T12:34:56.789Z',
        });

        const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1]);
        expect(sentMessage.data.userId).toBe('');
        expect(sentMessage.data.externalId).toBe('');
      });

      it('should handle very large multiplier values', async () => {
        rabbitmqProducer['channel'] = mockChannel;

        await rabbitmqProducer.publishCashin({
          cashType: TransactionSource.BET_PLACED,
          userId: 'user-123',
          multiplier: 999999.999,
          externalId: 'ext-456',
          tracingId: 'trace-789',
          timestamp: '2023-08-01T12:34:56.789Z',
        });

        const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1]);
        expect(sentMessage.data.multiplier).toBe(999999.999);
      });
    });
  });
});
