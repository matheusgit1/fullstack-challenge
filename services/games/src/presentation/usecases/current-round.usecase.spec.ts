import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentRoundUseCase } from './current-round.usecase';
import { CurrentRoundResponseDto } from '../dtos/response/current-round-response.dto';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';

describe('CurrentRoundUseCase', () => {
  const mockRoundRepository = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockCurrentRound = {
    id: 'round-123',
    status: 'betting',
    multiplier: 1.0,
    bets: [],
    serverSeedHash: '0x7d4e7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    bettingEndsAt: new Date('2024-01-15T10:30:00Z'),
    startedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const currentRoundUseCase = new CurrentRoundUseCase(mockRoundRepository);

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return current round successfully when a betting round exists', async () => {
      // Arrange
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(mockCurrentRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(CurrentRoundResponseDto);
      expect(result).toEqual({
        id: mockCurrentRound.id,
        status: mockCurrentRound.status,
        multiplier: mockCurrentRound.multiplier,
        bets: mockCurrentRound.bets,
        serverSeedHash: mockCurrentRound.serverSeedHash,
        bettingEndsAt: mockCurrentRound.bettingEndsAt,
        startedAt: mockCurrentRound.startedAt,
      });
    });

    it('should handle round with bets array', async () => {
      // Arrange
      const roundWithBets = {
        ...mockCurrentRound,
        bets: [
          {
            id: 'bet-1',
            userId: 'user-1',
            amount: 100,
            status: 'PENDING',
          },
          {
            id: 'bet-2',
            userId: 'user-2',
            amount: 250,
            status: 'PENDING',
          },
        ],
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(roundWithBets);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bets).toHaveLength(2);
      expect(result.bets[0].id).toBe('bet-1');
      expect(result.bets[1].amount).toBe(250);
    });

    it('should handle round with different status values', async () => {
      // Arrange
      const runningRound = {
        ...mockCurrentRound,
        status: 'running',
        multiplier: 2.5,
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(runningRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.status).toBe('running');
      expect(result.multiplier).toBe(2.5);
    });

    it('should handle round with null values for optional fields', async () => {
      // Arrange
      const roundWithNulls = {
        id: 'round-123',
        status: 'betting',
        multiplier: null,
        bets: null,
        serverSeedHash: null,
        bettingEndsAt: null,
        startedAt: null,
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(roundWithNulls);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.multiplier).toBeNull();
      expect(result.bets).toBeNull();
      expect(result.serverSeedHash).toBeNull();
      expect(result.bettingEndsAt).toBeNull();
      expect(result.startedAt).toBeNull();
    });

    it('should handle round with empty bets array', async () => {
      // Arrange
      const roundWithEmptyBets = {
        ...mockCurrentRound,
        bets: [],
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(roundWithEmptyBets);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bets).toEqual([]);
      expect(result.bets).toHaveLength(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw NotFoundException when no current betting round exists', async () => {
      // Arrange
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(currentRoundUseCase.handler()).rejects.toThrow(NotFoundException);
      await expect(currentRoundUseCase.handler()).rejects.toThrow(NotFoundException);

      expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledTimes(2);
    });

    it('should propagate error when repository throws database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockRoundRepository.findCurrentBettingRound.mockRejectedValue(dbError);

      // Act & Assert
      await expect(currentRoundUseCase.handler()).rejects.toThrow('Database connection failed');
      expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledTimes(1);
    });

    it('should propagate error when repository throws timeout error', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      mockRoundRepository.findCurrentBettingRound.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(currentRoundUseCase.handler()).rejects.toThrow('Query timeout');
    });

    it('should propagate error when repository throws permission error', async () => {
      // Arrange
      const permissionError = new Error('Access denied to round repository');
      mockRoundRepository.findCurrentBettingRound.mockRejectedValue(permissionError);

      // Act & Assert
      await expect(currentRoundUseCase.handler()).rejects.toThrow('Access denied to round repository');
    });
  });

  describe('Edge Cases', () => {
    it('should handle round with very large multiplier', async () => {
      // Arrange
      const highMultiplierRound = {
        ...mockCurrentRound,
        multiplier: 999999.99,
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(highMultiplierRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.multiplier).toBe(999999.99);
    });

    it('should handle round with very old dates', async () => {
      // Arrange
      const oldDatesRound = {
        ...mockCurrentRound,
        bettingEndsAt: new Date('2020-01-01T00:00:00Z'),
        startedAt: new Date('2019-12-31T23:59:59Z'),
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(oldDatesRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bettingEndsAt).toEqual(oldDatesRound.bettingEndsAt);
      expect(result.startedAt).toEqual(oldDatesRound.startedAt);
    });

    it('should handle round with future dates', async () => {
      // Arrange
      const futureDatesRound = {
        ...mockCurrentRound,
        bettingEndsAt: new Date('2030-12-31T23:59:59Z'),
        startedAt: new Date('2030-12-31T23:00:00Z'),
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(futureDatesRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bettingEndsAt).toEqual(futureDatesRound.bettingEndsAt);
      expect(result.startedAt).toEqual(futureDatesRound.startedAt);
    });

    it('should handle round with long server seed hash', async () => {
      // Arrange
      const longHashRound = {
        ...mockCurrentRound,
        serverSeedHash: '0x' + 'a'.repeat(128),
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(longHashRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.serverSeedHash).toBe(longHashRound.serverSeedHash);
      expect(result.serverSeedHash?.length).toBe(130); // '0x' + 128 chars
    });

    it('should handle round with special characters in server seed hash', async () => {
      // Arrange
      const specialHashRound = {
        ...mockCurrentRound,
        serverSeedHash: '0x!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`',
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(specialHashRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.serverSeedHash).toBe(specialHashRound.serverSeedHash);
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform round entity to response DTO', async () => {
      // Arrange
      const complexRound = {
        id: 'round-complex-123',
        status: 'betting',
        multiplier: 1.75,
        bets: [
          { id: 'bet-1', userId: 'user-1', amount: 500, status: 'PENDING' },
          { id: 'bet-2', userId: 'user-2', amount: 1000, status: 'PENDING' },
        ],
        serverSeedHash: '0xabcdef1234567890',
        bettingEndsAt: new Date('2024-01-15T10:30:00Z'),
        startedAt: new Date('2024-01-15T10:00:00Z'),
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(complexRound);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result).toMatchObject({
        id: complexRound.id,
        status: complexRound.status,
        multiplier: complexRound.multiplier,
        bets: complexRound.bets,
        serverSeedHash: complexRound.serverSeedHash,
        bettingEndsAt: complexRound.bettingEndsAt,
        startedAt: complexRound.startedAt,
      });
    });

    it('should preserve date object references', async () => {
      // Arrange
      const bettingEndsAt = new Date('2024-01-15T10:30:00Z');
      const startedAt = new Date('2024-01-15T10:00:00Z');

      const roundWithDates = {
        ...mockCurrentRound,
        bettingEndsAt,
        startedAt,
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(roundWithDates);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bettingEndsAt).toBe(bettingEndsAt);
      expect(result.startedAt).toBe(startedAt);
      expect(result.bettingEndsAt).toBeInstanceOf(Date);
      expect(result.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('Repository Method Verification', () => {
    it('should call findCurrentBettingRound exactly once', async () => {
      // Arrange
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(mockCurrentRound);

      // Act
      await currentRoundUseCase.handler();

      // Assert
      expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledTimes(1);
      expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledWith();
    });

    it('should not call any other repository methods', async () => {
      // Arrange
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(mockCurrentRound);

      // Act
      await currentRoundUseCase.handler();

      // Assert
      expect(mockRoundRepository.findByRoundId).not.toHaveBeenCalled();
      expect(mockRoundRepository.findCurrentRunningRound).not.toHaveBeenCalled();
      expect(mockRoundRepository.findRoundWithBets).not.toHaveBeenCalled();
      expect(mockRoundRepository.findRoundsHistory).not.toHaveBeenCalled();
      expect(mockRoundRepository.saveRound).not.toHaveBeenCalled();
      expect(mockRoundRepository.createRound).not.toHaveBeenCalled();
    });

    // it('should handle concurrent calls correctly', async () => {
    //   // Arrange
    //   mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce({
    //     id: 'currentRound.id',
    //     status: RoundStatus.BETTING,
    //     multiplier: 20,
    //     bets: [],
    //     serverSeedHash: 'hash',
    //     bettingEndsAt: '2024-01-15T10:30:00Z',
    //     startedAt: '2024-01-15T10:30:00Z',
    //   });

    //   // Act
    //   const [result1, result2] = await Promise.all([currentRoundUseCase.handler(), currentRoundUseCase.handler()]);

    //   // Assert
    //   expect(result1).toBeInstanceOf(CurrentRoundResponseDto);
    //   expect(result2).toBeInstanceOf(CurrentRoundResponseDto);
    //   expect(mockRoundRepository.findCurrentBettingRound).toHaveBeenCalledTimes(2);
    // });
  });

  describe('Performance Considerations', () => {
    it('should handle large bets array efficiently', async () => {
      // Arrange
      const largeBetsArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `bet-${i}`,
        userId: `user-${i % 10}`,
        amount: Math.floor(Math.random() * 10000),
        status: 'PENDING',
      }));

      const roundWithManyBets = {
        ...mockCurrentRound,
        bets: largeBetsArray,
      };

      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(roundWithManyBets);

      // Act
      const result = await currentRoundUseCase.handler();

      // Assert
      expect(result.bets).toHaveLength(1000);
      expect(result.bets).toEqual(largeBetsArray);
    });

    it('should return response quickly when repository resolves fast', async () => {
      // Arrange
      mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(mockCurrentRound);

      // Act
      const startTime = Date.now();
      await currentRoundUseCase.handler();
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
