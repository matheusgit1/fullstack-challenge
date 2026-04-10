import { CashinMessage, CashoutMessage, CashReserveMessage, RabbitmqController } from './rabbitmq.controller';
import { IRabbitmqService } from '@/domain/rabbitmq/rabbitmq.service';
import { RmqContext } from '@nestjs/microservices';
import { TransactionSource } from '../database/orm/entites/transaction.entity';

describe('RabbitmqController', () => {
  const mockRabbitmqService: jest.Mocked<IRabbitmqService> = {
    processCashin: jest.fn(),
    processCashout: jest.fn(),
    processReserve: jest.fn(),
  };
  const rabbitmqController = new RabbitmqController(mockRabbitmqService);
  const rmqContext = {
    getChannelRef: () => {
      return { ack: (_: any) => {}, nack: (a: any, b: boolean) => {} };
    },
    getMessage: () => {
      return {
        content: Buffer.from(JSON.stringify({})),
      };
    },
  } as unknown as RmqContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  describe('onCash', () => {
    it('should process reserve', async () => {
      const message: CashReserveMessage = {
        cashType: TransactionSource.BET_RESERVE,
        userId: 'aaaaa',
        amount: 111111,
        timestamp: 'aaaaa',
        externalId: 'nbbbb',
        tracingId: 'aaaaa',
      };
      await rabbitmqController.onCash(message, rmqContext);

      expect(mockRabbitmqService.processReserve).toHaveBeenCalledTimes(1);
    });

    it('should process cashin', async () => {
      const message: CashinMessage = {
        cashType: TransactionSource.BET_PLACED,
        userId: 'aaaaa',
        multiplier: 1,
        timestamp: 'aaaaa',
        externalId: 'nbbbb',
        tracingId: 'aaaaa',
      };
      await rabbitmqController.onCash(message, rmqContext);

      expect(mockRabbitmqService.processCashin).toHaveBeenCalledTimes(1);
    });

    it('should process cashout', async () => {
      const message: CashoutMessage = {
        cashType: TransactionSource.BET_LOST,
        userId: 'aaaaa',
        timestamp: 'aaaaa',
        externalId: 'nbbbb',
        tracingId: 'aaaaa',
      };
      await rabbitmqController.onCash(message, rmqContext);

      expect(mockRabbitmqService.processCashout).toHaveBeenCalledTimes(1);
    });
  });
});
