import { Test, TestingModule } from '@nestjs/testing';
import { VerifyRoundUsecase } from './verify-round.usecase';
import { RoundVerifyResponseDto } from '../dtos/response/round-verify-response.dto';
import { IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';

describe('VerifyRoundUsecase', () => {
  const mockProvablyFairService: jest.Mocked<IProvablyFairService> = {
    generateNewSeed: jest.fn(),
    getActiveSeed: jest.fn(),
    getNextSeedForRound: jest.fn(),
    incrementNonce: jest.fn(),
    calculateCrashPoint: jest.fn(),
    verifyRound: jest.fn(),
    setSeedAsUsed: jest.fn(),
    rotateSeed: jest.fn(),
    getUserSeedsHistory: jest.fn(),
    getProvablyFairRound: jest.fn(),
  };

  const verifyRoundUsecase = new VerifyRoundUsecase(mockProvablyFairService);

  const mockProvablyFairData = {
    id: 'fair-123',
    serverSeed: 'server-seed-abc-123',
    clientSeed: 'client-seed-xyz-456',
    nonce: 42,
    serverSeedHash: '0x7d4e7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
  } as any;

  beforeAll(async () => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should return provably fair data for a valid round', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith(roundId);
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result).toEqual({
        fairId: mockProvablyFairData.id,
        serverSeed: mockProvablyFairData.serverSeed,
        clientSeed: mockProvablyFairData.clientSeed,
        nonce: mockProvablyFairData.nonce,
        serverSeedHash: mockProvablyFairData.serverSeedHash,
      });
    });

    it('should handle round with minimum valid data', async () => {
      // Arrange
      const roundId = 'round-minimal';
      const minimalData = {
        id: 'fair-456',
        serverSeed: 'seed123',
        clientSeed: 'seed456',
        nonce: 1,
        serverSeedHash: 'hash123',
      } as any;
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(minimalData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result.fairId).toBe(minimalData.id);
      expect(result.serverSeed).toBe(minimalData.serverSeed);
      expect(result.clientSeed).toBe(minimalData.clientSeed);
      expect(result.nonce).toBe(minimalData.nonce);
      expect(result.serverSeedHash).toBe(minimalData.serverSeedHash);
    });

    it('should handle round with zero nonce', async () => {
      // Arrange
      const roundId = 'round-zero-nonce';
      const dataWithZeroNonce = {
        ...mockProvablyFairData,
        nonce: 0,
      };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(dataWithZeroNonce);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result.nonce).toBe(0);
    });

    it('should handle round with very large nonce', async () => {
      // Arrange
      const roundId = 'round-large-nonce';
      const dataWithLargeNonce = {
        ...mockProvablyFairData,
        nonce: 999999999,
      };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(dataWithLargeNonce);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result.nonce).toBe(999999999);
    });

    it('should handle round with long seed values', async () => {
      // Arrange
      const roundId = 'round-long-seeds';
      const longSeedData = {
        ...mockProvablyFairData,
        serverSeed: 'a'.repeat(1000),
        clientSeed: 'b'.repeat(1000),
        serverSeedHash: 'c'.repeat(200),
      };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(longSeedData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result.serverSeed).toHaveLength(1000);
      expect(result.clientSeed).toHaveLength(1000);
      expect(result.serverSeedHash).toHaveLength(200);
    });

    it('should handle round with special characters in seeds', async () => {
      // Arrange
      const roundId = 'round-special-chars';
      const specialCharsData = {
        ...mockProvablyFairData,
        serverSeed: '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`',
        clientSeed: 'áéíóúñÑçÇ€£¥©®™',
        serverSeedHash: '0x!@#$%^&*()',
      };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(specialCharsData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result.serverSeed).toBe(specialCharsData.serverSeed);
      expect(result.clientSeed).toBe(specialCharsData.clientSeed);
      expect(result.serverSeedHash).toBe(specialCharsData.serverSeedHash);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw error when round is not found', async () => {
      // Arrange
      const roundId = 'non-existent-round';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith(roundId);
    });

    it('should propagate error when service throws database error', async () => {
      // Arrange
      const roundId = 'round-123';
      const dbError = new Error('Database connection failed');
      mockProvablyFairService.getProvablyFairRound.mockRejectedValue(dbError);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow('Database connection failed');
    });

    it('should propagate error when service throws timeout error', async () => {
      // Arrange
      const roundId = 'round-123';
      const timeoutError = new Error('Service timeout');
      mockProvablyFairService.getProvablyFairRound.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow('Service timeout');
    });

    it('should propagate error when service throws permission error', async () => {
      // Arrange
      const roundId = 'round-123';
      const permissionError = new Error('Access denied');
      mockProvablyFairService.getProvablyFairRound.mockRejectedValue(permissionError);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow('Access denied');
    });

    it('should throw error when roundId is empty string', async () => {
      // Arrange
      const roundId = '';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });

    it('should throw error when roundId is null or undefined', async () => {
      // Arrange
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(null as any)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
      await expect(verifyRoundUsecase.handler(undefined as any)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle round with null values', async () => {
      // Arrange
      const roundId = 'round-null-values';
      const dataWithNulls = {
        id: null,
        serverSeed: null,
        clientSeed: null,
        nonce: null,
        serverSeedHash: null,
      } as any;
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });

    it('should handle round with numeric string roundId', async () => {
      // Arrange
      const roundId = '12345';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith('12345');
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
    });

    it('should handle round with UUID format', async () => {
      // Arrange
      const roundId = '123e4567-e89b-12d3-a456-426614174000';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith(roundId);
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
    });

    it('should handle round with very long roundId', async () => {
      // Arrange
      const roundId = 'a'.repeat(1000);
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith(roundId);
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
    });
  });

  describe('Return Type Validation', () => {
    it('should return instance of RoundVerifyResponseDto', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
    });

    it('should return object with correct structure', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result).toHaveProperty('fairId');
      expect(result).toHaveProperty('serverSeed');
      expect(result).toHaveProperty('clientSeed');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('serverSeedHash');
    });

    it('should not have additional properties beyond DTO', async () => {
      // Arrange
      const roundId = 'round-123';
      const extraData = {
        ...mockProvablyFairData,
        extraField: 'should not be included',
        anotherField: 123,
      };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(extraData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result).not.toHaveProperty('extraField');
      expect(result).not.toHaveProperty('anotherField');
    });
  });

  describe('Service Method Verification', () => {
    it('should call getProvablyFairDataForRound exactly once', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledTimes(1);
    });

    it('should call getProvablyFairDataForRound with correct roundId', async () => {
      // Arrange
      const roundId = 'round-456';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith('round-456');
    });

    it('should not call any other service methods', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.generateNewSeed).not.toHaveBeenCalled();
      expect(mockProvablyFairService.getActiveSeed).not.toHaveBeenCalled();
      expect(mockProvablyFairService.getNextSeedForRound).not.toHaveBeenCalled();
      expect(mockProvablyFairService.incrementNonce).not.toHaveBeenCalled();
      expect(mockProvablyFairService.calculateCrashPoint).not.toHaveBeenCalled();
      expect(mockProvablyFairService.verifyRound).not.toHaveBeenCalled();
      expect(mockProvablyFairService.setSeedAsUsed).not.toHaveBeenCalled();
      expect(mockProvablyFairService.rotateSeed).not.toHaveBeenCalled();
      expect(mockProvablyFairService.getUserSeedsHistory).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Concurrent Calls', () => {
    it('should handle concurrent requests for different rounds', async () => {
      // Arrange
      const roundId1 = 'round-1';
      const roundId2 = 'round-2';
      const roundId3 = 'round-3';

      mockProvablyFairService.getProvablyFairRound
        .mockResolvedValueOnce(mockProvablyFairData)
        .mockResolvedValueOnce({ ...mockProvablyFairData, id: 'fair-2' })
        .mockResolvedValueOnce({ ...mockProvablyFairData, id: 'fair-3' });

      // Act
      const [result1, result2, result3] = await Promise.all([
        verifyRoundUsecase.handler(roundId1),
        verifyRoundUsecase.handler(roundId2),
        verifyRoundUsecase.handler(roundId3),
      ]);

      // Assert
      expect(result1).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result2).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result3).toBeInstanceOf(RoundVerifyResponseDto);
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent requests for same round', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const [result1, result2, result3] = await Promise.all([
        verifyRoundUsecase.handler(roundId),
        verifyRoundUsecase.handler(roundId),
        verifyRoundUsecase.handler(roundId),
      ]);

      // Assert
      expect(result1).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result2).toBeInstanceOf(RoundVerifyResponseDto);
      expect(result3).toBeInstanceOf(RoundVerifyResponseDto);
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid sequential calls efficiently', async () => {
      // Arrange
      const roundId = 'round-123';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await verifyRoundUsecase.handler(roundId);
      }
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledTimes(10);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve exact values without modification', async () => {
      // Arrange
      const roundId = 'round-123';
      const exactData = {
        id: 'exact-fair-id',
        serverSeed: 'exact-server-seed',
        clientSeed: 'exact-client-seed',
        nonce: 123456,
        serverSeedHash: 'exact-hash-value',
      } as any;
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(exactData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(result.fairId).toBe('exact-fair-id');
      expect(result.serverSeed).toBe('exact-server-seed');
      expect(result.clientSeed).toBe('exact-client-seed');
      expect(result.nonce).toBe(123456);
      expect(result.serverSeedHash).toBe('exact-hash-value');
    });

    it('should not mutate the original data', async () => {
      // Arrange
      const roundId = 'round-123';
      const originalData = { ...mockProvablyFairData };
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairData).toEqual(originalData);
    });
  });

  describe('Error Messages', () => {
    it('should return Portuguese error message for not found round', async () => {
      // Arrange
      const roundId = 'non-existent';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });

    it('should return Portuguese error message for corrupted data', async () => {
      // Arrange
      const roundId = 'corrupted-round';
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });
  });

  describe('Type Safety', () => {
    it('should handle number type roundId (if passed as number)', async () => {
      // Arrange
      const roundId = 123 as any;
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(mockProvablyFairData);

      // Act
      const result = await verifyRoundUsecase.handler(roundId);

      // Assert
      expect(mockProvablyFairService.getProvablyFairRound).toHaveBeenCalledWith(123);
      expect(result).toBeInstanceOf(RoundVerifyResponseDto);
    });

    it('should handle boolean roundId (should fail gracefully)', async () => {
      // Arrange
      const roundId = true as any;
      mockProvablyFairService.getProvablyFairRound.mockResolvedValue(null);

      // Act & Assert
      await expect(verifyRoundUsecase.handler(roundId)).rejects.toThrow(
        "Round não encontrado ou 'provably fair' corrompido",
      );
    });
  });
});
