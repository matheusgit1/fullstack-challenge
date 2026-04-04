import { IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { IRabbitmqProducerService, TransactionSource } from '@/domain/rabbitmq/rabbitmq.producer';
import { IWebSocketService } from '@/domain/websocket/websocket.service';
import { BetEventHandler } from './bet-event.handler';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';

describe('BetEventHandler', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as any;

  const mockWebSocketService: jest.Mocked<IWebSocketService> = {
    generateClientId: jest.fn(),
    addClient: jest.fn(),
    removeClient: jest.fn(),
    sendConnectionSuccess: jest.fn(),
    sendPong: jest.fn(),
    sendToClient: jest.fn(),
    broadcast: jest.fn(),
  };

  const mockBetRepository: jest.Mocked<IBetRepository> = {
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    createBet: jest.fn(),
    findUserBetsHistory: jest.fn(),
  };

  const mockRabbitmqProducer: jest.Mocked<IRabbitmqProducerService> = {
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
    publishReserve: jest.fn(),
  };

  let betEventHandler: BetEventHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    betEventHandler = new BetEventHandler(mockWebSocketService, mockBetRepository, mockRabbitmqProducer);
    betEventHandler.logger = logger;
  });

  describe('Success Scenarios', () => {
    describe('handleNewBetting', () => {
      it('should broadcast betting.running event', () => {
        const payload = { roundId: 'round-123', timestamp: new Date() };

        betEventHandler.handleNewBetting(payload);

        expect(logger.log).toHaveBeenCalledWith('betting.running received');
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.running', payload);
      });

      it('should handle empty payload', () => {
        const payload = {};

        betEventHandler.handleNewBetting(payload);

        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.running', payload);
      });

      it('should handle payload with nested objects', () => {
        const payload = {
          roundId: 'round-123',
          data: {
            multiplier: 2.5,
            timestamp: Date.now(),
          },
        };

        betEventHandler.handleNewBetting(payload);

        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.running', payload);
      });
    });

    describe('handleMultiplierUpdated', () => {
      it('should broadcast multiplier.updated event', () => {
        const payload = { roundId: 'round-123', multiplier: 2.5 };

        betEventHandler.handleMultiplierUpdated(payload);

        expect(logger.log).toHaveBeenCalledWith('multiplier.updated received');
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('multiplier.updated', payload);
      });

      it('should handle multiplier with decimal values', () => {
        const payload = { multiplier: 1.23456789 };

        betEventHandler.handleMultiplierUpdated(payload);

        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('multiplier.updated', payload);
      });

      it('should handle negative multiplier values', () => {
        const payload = { multiplier: -1.5 };

        betEventHandler.handleMultiplierUpdated(payload);

        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('multiplier.updated', payload);
      });
    });

    describe('handleNewRound', () => {
      it('should broadcast round.betting.started event', () => {
        const payload = { roundId: 'round-123', startTime: new Date() };

        betEventHandler.handleNewRound(payload);

        expect(logger.log).toHaveBeenCalledWith('round.betting.started received');
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('round.betting.started', payload);
      });

      it('should handle round configuration payload', () => {
        const payload = {
          roundId: 'round-123',
          config: {
            maxBet: 1000,
            minBet: 10,
            duration: 30,
          },
        };

        betEventHandler.handleNewRound(payload);

        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('round.betting.started', payload);
      });
    });

    describe('handleGameLoose', () => {
      const mockBets: Bet[] = [
        {
          id: 'bet-1',
          userId: 'user-1',
          roundId: 'round-123',
          amount: 100,
          status: BetStatus.PENDING,
          multiplier: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Bet,
        {
          id: 'bet-2',
          userId: 'user-2',
          roundId: 'round-123',
          amount: 200,
          status: BetStatus.PENDING,
          multiplier: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Bet,
      ];

      const payload = {
        roundId: 'round-123',
        tracingId: 'trace-456',
        crashedAt: new Date(),
      };

      it('should process lost bets and broadcast event', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler.handleGameLoose(payload);

        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-456] betting.loose received');
        expect(mockBetRepository.findLooserBetsByRoundId).toHaveBeenCalledWith('round-123');
        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-456] Found 2 pending bets to update for loose event');
        expect(mockBetRepository.save).toHaveBeenCalledTimes(2);
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(2);
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.loose', payload);
        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-456] Successfully processed 2 lost bets');
      });

      it('should handle case with no lost bets', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([]);

        await betEventHandler.handleGameLoose(payload);

        expect(mockBetRepository.findLooserBetsByRoundId).toHaveBeenCalledWith('round-123');
        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-456] No lost bets to process');
        expect(mockBetRepository.save).not.toHaveBeenCalled();
        expect(mockRabbitmqProducer.publishCashout).not.toHaveBeenCalled();
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.loose', payload);
      });

      it('should process lost bets with correct cashout notification', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([mockBets[0]]);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler.handleGameLoose(payload);

        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith({
          cashType: TransactionSource.BET_LOST,
          userId: 'user-1',
          timestamp: expect.any(String),
          externalId: 'bet-1',
          tracingId: 'trace-456',
        });
      });

      it('should update bet status to LOST', async () => {
        const bet = mockBets[0];
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([bet]);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler.handleGameLoose(payload);

        expect(mockBetRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...bet,
            status: BetStatus.LOST,
          }),
        );
      });
    });

    describe('handleGameCrashed', () => {
      const mockBets: Bet[] = [
        {
          id: 'bet-1',
          userId: 'user-1',
          roundId: 'round-123',
          amount: 150,
          status: BetStatus.PENDING,
          multiplier: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Bet,
      ];

      const payload = {
        roundId: 'round-123',
        tracingId: 'trace-789',
        crashedAt: new Date(),
      };

      it('should process lost bets and broadcast event', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler.handleGameCrashed(payload);

        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-789] betting.crashed received');
        expect(mockBetRepository.findLooserBetsByRoundId).toHaveBeenCalledWith('round-123');
        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-789] Found 1 pending bets to update for crashed event');
        expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(1);
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.crashed', payload);
        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-789] Successfully processed 1 lost bets');
      });

      it('should handle case with no lost bets', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([]);

        await betEventHandler.handleGameCrashed(payload);

        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-789] No lost bets to process');
        expect(mockBetRepository.save).not.toHaveBeenCalled();
        expect(mockRabbitmqProducer.publishCashout).not.toHaveBeenCalled();
      });

      it('should process multiple lost bets concurrently', async () => {
        const multipleBets = Array.from(
          { length: 10 },
          (_, i) =>
            ({
              id: `bet-${i}`,
              userId: `user-${i}`,
              roundId: 'round-123',
              amount: 100 * i,
              status: BetStatus.PENDING,
            }) as Bet,
        );

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(multipleBets);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler.handleGameCrashed(payload);

        expect(mockBetRepository.save).toHaveBeenCalledTimes(10);
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(10);
      });
    });

    describe('processLostBets', () => {
      const mockBets: Bet[] = [
        {
          id: 'bet-1',
          userId: 'user-1',
          roundId: 'round-123',
          amount: 100,
          status: BetStatus.PENDING,
        } as Bet,
      ];

      const payload = {
        roundId: 'round-123',
        tracingId: 'trace-456',
      };

      it('should process lost bets with parallel promises', async () => {
        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['processLostBets'](payload, 'loose');

        expect(mockBetRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(1);
      });

      it('should handle large number of bets efficiently', async () => {
        const largeBetsList = Array.from(
          { length: 100 },
          (_, i) =>
            ({
              id: `bet-${i}`,
              userId: `user-${i}`,
              roundId: 'round-123',
              amount: 100,
              status: BetStatus.PENDING,
            }) as Bet,
        );

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(largeBetsList);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        const startTime = Date.now();
        await betEventHandler['processLostBets'](payload, 'loose');
        const endTime = Date.now();

        expect(mockBetRepository.save).toHaveBeenCalledTimes(100);
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledTimes(100);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      });
    });

    describe('updateLostBet', () => {
      const mockBet: Bet = {
        id: 'bet-1',
        userId: 'user-1',
        roundId: 'round-123',
        amount: 100,
        status: BetStatus.PENDING,
      } as Bet;

      const tracingId = 'trace-456';

      it('should update bet status to LOST', async () => {
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['updateLostBet'](mockBet, tracingId);

        expect(logger.log).toHaveBeenCalledWith('[Trace:trace-456] Updating bet bet-1');
        expect(mockBetRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockBet,
            status: BetStatus.LOST,
          }),
        );
      });

      it('should notify cashout for lost bet', async () => {
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['updateLostBet'](mockBet, tracingId);

        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith({
          cashType: TransactionSource.BET_LOST,
          userId: mockBet.userId,
          timestamp: expect.any(String),
          externalId: mockBet.id,
          tracingId: tracingId,
        });
      });

      it('should execute save and notify in parallel', async () => {
        let saveCompleted = false;
        let notifyCompleted = false;

        mockBetRepository.save.mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          saveCompleted = true;
          return {} as Bet;
        });

        mockRabbitmqProducer.publishCashout.mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          notifyCompleted = true;
          return undefined;
        });

        await betEventHandler['updateLostBet'](mockBet, tracingId);

        expect(saveCompleted).toBe(true);
        expect(notifyCompleted).toBe(true);
      });
    });

    describe('notifyCashout', () => {
      const notification = {
        cashType: TransactionSource.BET_LOST,
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        externalId: 'bet-1',
        tracingId: 'trace-456',
      };

      it('should call publishCashout with correct parameters', async () => {
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['notifyCashout'](notification);

        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith({
          cashType: notification.cashType,
          userId: notification.userId,
          timestamp: notification.timestamp,
          externalId: notification.externalId,
          tracingId: notification.tracingId,
        });
      });

      it('should handle timestamp as string', async () => {
        const notificationWithDate = {
          ...notification,
          timestamp: new Date().toISOString(),
        };

        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['notifyCashout'](notificationWithDate);

        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: expect.any(String),
          }),
        );
      });
    });
  });

  describe('Failure Scenarios', () => {
    describe('handleGameLoose', () => {
      const payload = {
        roundId: 'round-123',
        tracingId: 'trace-456',
      };

      it('should handle error when findLooserBetsByRoundId fails', async () => {
        const error = new Error('Database connection failed');
        mockBetRepository.findLooserBetsByRoundId.mockRejectedValue(error);

        await expect(betEventHandler.handleGameLoose(payload)).rejects.toThrow('Database connection failed');
        expect(mockWebSocketService.broadcast).not.toHaveBeenCalled();
      });

      it('should handle error when saving bet fails', async () => {
        const mockBets = [
          {
            id: 'bet-1',
            userId: 'user-1',
            roundId: 'round-123',
            amount: 100,
            status: BetStatus.PENDING,
          } as Bet,
        ];

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        const saveError = new Error('Failed to save bet');
        mockBetRepository.save.mockRejectedValue(saveError);

        await expect(betEventHandler.handleGameLoose(payload)).rejects.toThrow('Failed to save bet');
      });

      it('should handle error when publishCashout fails', async () => {
        const mockBets = [
          {
            id: 'bet-1',
            userId: 'user-1',
            roundId: 'round-123',
            amount: 100,
            status: BetStatus.PENDING,
          } as Bet,
        ];

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        mockBetRepository.save.mockResolvedValue({} as Bet);
        const cashoutError = new Error('RabbitMQ connection failed');
        mockRabbitmqProducer.publishCashout.mockRejectedValue(cashoutError);

        await expect(betEventHandler.handleGameLoose(payload)).rejects.toThrow('RabbitMQ connection failed');
      });

      it('should handle partial failures when processing multiple bets', async () => {
        const mockBets: Bet[] = [
          { id: 'bet-1', userId: 'user-1', roundId: 'round-123', amount: 100, status: BetStatus.PENDING } as Bet,
          { id: 'bet-2', userId: 'user-2', roundId: 'round-123', amount: 200, status: BetStatus.PENDING } as Bet,
        ];

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
        mockBetRepository.save
          .mockResolvedValueOnce({} as Bet)
          .mockRejectedValueOnce(new Error('Save failed for bet-2'));
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await expect(betEventHandler.handleGameLoose(payload)).rejects.toThrow('Save failed for bet-2');
      });
    });

    describe('handleGameCrashed', () => {
      const payload = {
        roundId: 'round-123',
        tracingId: 'trace-456',
      };

      it('should handle error when repository fails', async () => {
        const error = new Error('Repository error');
        mockBetRepository.findLooserBetsByRoundId.mockRejectedValue(error);

        await expect(betEventHandler.handleGameCrashed(payload)).rejects.toThrow('Repository error');
      });

      it('should handle error when no tracingId is provided', async () => {
        const payloadWithoutTrace = {
          roundId: 'string',
          tracingId: 'tracingId',
        };

        const broadcast = jest.spyOn(mockWebSocketService, 'broadcast');

        mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([]);

        await betEventHandler.handleGameCrashed(payloadWithoutTrace);

        expect(broadcast).toHaveBeenCalledTimes(1);
        expect(broadcast).toHaveBeenCalledWith('betting.crashed', payloadWithoutTrace);
      });
    });

    describe('updateLostBet', () => {
      const mockBet: Bet = {
        id: 'bet-1',
        userId: 'user-1',
        roundId: 'round-123',
        amount: 100,
        status: BetStatus.PENDING,
      } as Bet;

      it('should handle error when save fails', async () => {
        const error = new Error('Save failed');
        mockBetRepository.save.mockRejectedValue(error);

        await expect(betEventHandler['updateLostBet'](mockBet, 'trace-456')).rejects.toThrow('Save failed');
      });

      it('should handle error when notifyCashout fails', async () => {
        mockBetRepository.save.mockResolvedValue({} as Bet);
        const error = new Error('Notify failed');
        mockRabbitmqProducer.publishCashout.mockRejectedValue(error);

        await expect(betEventHandler['updateLostBet'](mockBet, 'trace-456')).rejects.toThrow('Notify failed');
      });

      it('should handle bet with missing fields', async () => {
        const incompleteBet = { id: 'bet-1' } as Bet;
        mockBetRepository.save.mockResolvedValue({} as Bet);
        mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

        await betEventHandler['updateLostBet'](incompleteBet, 'trace-456');

        expect(mockBetRepository.save).toHaveBeenCalled();
        expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
          expect.objectContaining({
            externalId: 'bet-1',
          }),
        );
      });
    });

    describe('notifyCashout', () => {
      it('should handle error when rabbitmq producer fails', async () => {
        const notification = {
          cashType: TransactionSource.BET_LOST,
          userId: 'user-1',
          timestamp: new Date().toISOString(),
          externalId: 'bet-1',
          tracingId: 'trace-456',
        };

        const error = new Error('RabbitMQ error');
        mockRabbitmqProducer.publishCashout.mockRejectedValue(error);

        await expect(betEventHandler['notifyCashout'](notification)).rejects.toThrow('RabbitMQ error');
      });

      it('should handle invalid notification data', async () => {
        const invalidNotification = {
          cashType: 'INVALID_TYPE',
          userId: '',
          externalId: '',
        } as any;

        mockRabbitmqProducer.publishCashout.mockRejectedValue(new Error('Invalid notification'));

        await expect(betEventHandler['notifyCashout'](invalidNotification)).rejects.toThrow();
      });
    });

    describe('Event Handlers Edge Cases', () => {
      it('should handle null payload in handleNewBetting', () => {
        expect(() => betEventHandler.handleNewBetting(null)).not.toThrow();
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.running', null);
      });

      it('should handle undefined payload in handleMultiplierUpdated', () => {
        expect(() => betEventHandler.handleMultiplierUpdated(undefined)).not.toThrow();
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('multiplier.updated', undefined);
      });

      it('should handle circular references in payload', () => {
        const circularPayload: any = { roundId: 'round-123' };
        circularPayload.self = circularPayload;

        expect(() => betEventHandler.handleNewRound(circularPayload)).not.toThrow();
        expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('round.betting.started', circularPayload);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple events in sequence', async () => {
      const roundPayload = { roundId: 'round-123', tracingId: 'trace-1' };
      const multiplierPayload = { roundId: 'round-123', multiplier: 1.5 };
      const loosePayload = { roundId: 'round-123', tracingId: 'trace-1' };

      mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([]);

      betEventHandler.handleNewRound(roundPayload);
      betEventHandler.handleMultiplierUpdated(multiplierPayload);
      await betEventHandler.handleGameLoose(loosePayload);

      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('round.betting.started', roundPayload);
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('multiplier.updated', multiplierPayload);
      expect(mockWebSocketService.broadcast).toHaveBeenCalledWith('betting.loose', loosePayload);
    });

    it('should handle concurrent event emissions', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        roundId: `round-${i}`,
        tracingId: `trace-${i}`,
      }));

      mockBetRepository.findLooserBetsByRoundId.mockResolvedValue([]);

      const eventPromises = events.map((event) =>
        Promise.all([
          betEventHandler.handleNewRound(event),
          betEventHandler.handleMultiplierUpdated(event),
          betEventHandler.handleGameLoose(event),
        ]),
      );

      await expect(Promise.all(eventPromises)).resolves.not.toThrow();
    });

    it('should maintain data consistency across events', async () => {
      const roundId = 'round-123';
      const tracingId = 'trace-456';
      const mockBets = [{ id: 'bet-1', userId: 'user-1', roundId, amount: 100, status: BetStatus.PENDING } as Bet];

      mockBetRepository.findLooserBetsByRoundId.mockResolvedValue(mockBets);
      mockBetRepository.save.mockResolvedValue({} as Bet);
      mockRabbitmqProducer.publishCashout.mockResolvedValue(undefined);

      await betEventHandler.handleGameLoose({ roundId, tracingId });

      expect(mockBetRepository.findLooserBetsByRoundId).toHaveBeenCalledWith(roundId);
      expect(mockBetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          roundId: roundId,
          status: BetStatus.LOST,
        }),
      );
      expect(mockRabbitmqProducer.publishCashout).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: 'bet-1',
          tracingId: tracingId,
        }),
      );
    });
  });
});

// Helper function for logger assertions
expect.extend({
  toBeUndefinedOrCalled(received: any) {
    const pass =
      received === undefined ||
      received === null ||
      (typeof received === 'function' && received.mock?.calls?.length > 0);
    if (pass) {
      return {
        message: () => `expected ${received} not to be undefined or called`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be undefined or called`,
        pass: false,
      };
    }
  },
});
