import { AuthGuard } from '@/application/auth/auth.guard';
import { IProvablyFairService, PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { IKeyCloakService, KEYCLOACK_PROVIDER } from '@/domain/keycloack/keycloack.service';
import { BET_REPOSITORY, IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { IWalletProxy, WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { IRabbitmqProducerService, RABBITMQ_PRODUCER_SERVICE } from '@/domain/rabbitmq/rabbitmq.producer';
import { GlobalExceptionFilter } from '@/filters/global-execeptions.filters';
import { Bet, BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { Round, RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { LoggingInterceptor } from '@/interceptor/logging.interceptor';
import { ResponseInterceptor } from '@/interceptor/response.interceptor';
import { GamesController } from '@/presentation/controllers/games.controller';
import { GamesManager } from '@/presentation/manager/games.manager';
import { BetUseCase } from '@/presentation/usecases/bet.usecase';
import { CashOutUsecase } from '@/presentation/usecases/cashout.usecase';
import { CurrentRoundUseCase } from '@/presentation/usecases/current-round.usecase';
import { HistoryRoundUsecase } from '@/presentation/usecases/history-round.usecase';
import { GetMyBetsUseCase } from '@/presentation/usecases/my-bets.usecase';
import { HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Test } from '@nestjs/testing';
import crypto from 'crypto';
import request from 'supertest';

describe('E2E', () => {
  const mockRoundRepository = {
    findByRoundId: jest.fn(),
    findCurrentBettingRound: jest.fn(),
    findCurrentRunningRound: jest.fn(),
    findRoundWithBets: jest.fn(),
    findRoundsHistory: jest.fn(),
    saveRound: jest.fn(),
    createRound: jest.fn(),
  };

  const mockKeycloakService = {
    getUserFromToken: jest.fn(),
    getToken: jest.fn(),
  };

  const mockProvablyFairService = {
    generateNewSeed: jest.fn(),
    getActiveSeed: jest.fn(),
    getNextSeedForRound: jest.fn(),
    incrementNonce: jest.fn(),
    calculateCrashPoint: jest.fn(),
    verifyRound: jest.fn(),
    setSeedAsUsed: jest.fn(),
    rotateSeed: jest.fn(),
    getUserSeedsHistory: jest.fn(),
    getProvablyFairDataForRound: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: '123456',
    },
    hash: 'test-hash-123',
    token: 'test-token-123',
  };

  const mockBetRepository = {
    setPendingBetsToLost: jest.fn(),
    save: jest.fn(),
    findByFilters: jest.fn(),
    findPeddingBets: jest.fn(),
    findLooserBetsByRoundId: jest.fn(),
    createBet: jest.fn(),
    findUserBetsHistory: jest.fn(),
  };

  const mockRabbitmqProducer = {
    publishCashin: jest.fn(),
    publishCashout: jest.fn(),
    publishReserve: jest.fn(),
  };

  const mockWalletProxy = {
    getUserBalance: jest.fn(),
  };

  const currentRound = {
    id: 'id',
    status: RoundStatus.BETTING,
    multiplier: 1,
    bets: [],
    serverSeedHash: 'serverSeedHash',
    bettingEndsAt: new Date(),
    startedAt: new Date(),
    crashedAt: new Date(),
    serverSeed: 'serverSeed',
    clientSeed: 'clientSeed',
    nonce: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    bettingStartedAt: new Date(),
    crashPoint: 1,
    isBettingPhase: jest.fn().mockReturnValue(true),
    isRunning: jest.fn().mockReturnValue(true),
    isCrashed: jest.fn().mockReturnValue(false),
    canPlaceBet: jest.fn().mockReturnValue(true),
    canCashout: jest.fn().mockReturnValue(true),
    getBettingDurationMs: jest.fn().mockReturnValue(1000),
    getRemainingBettingTimeMs: jest.fn().mockReturnValue(1000),
    setStatus: jest.fn(),
    setMultiplier: jest.fn(),
  };

  const bet = {
    id: 'id',
    userId: 'userId',
    roundId: 'roundId',
    amount: 1,
    status: BetStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    multiplier: 1,
    cashedOutAt: new Date(),
    // round: currentRound,
    round: currentRound,
    cashout: jest.fn(),
    isPending: jest.fn().mockReturnValue(true),
    isCashedOut: jest.fn().mockReturnValue(false),
    isLost: jest.fn().mockReturnValue(false),
    lose: jest.fn(),
    getWinAmount: jest.fn().mockReturnValue(1),
  };

  @Module({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
    controllers: [GamesController],
    providers: [
      CurrentRoundUseCase,
      HistoryRoundUsecase,
      GetMyBetsUseCase,
      BetUseCase,
      CashOutUsecase,
      GamesManager,
      {
        provide: REQUEST,
        useValue: mockRequest,
      },
      {
        provide: ROUND_REPOSITORY,
        useValue: mockRoundRepository,
      },
      {
        provide: BET_REPOSITORY,
        useValue: mockBetRepository,
      },
      {
        provide: WALLET_PROXY,
        useValue: mockWalletProxy,
      },
      {
        provide: RABBITMQ_PRODUCER_SERVICE,
        useValue: {},
      },
      {
        provide: PROVABY_SERVICE,
        useValue: mockProvablyFairService,
      },
      {
        provide: KEYCLOACK_PROVIDER,
        useValue: mockKeycloakService,
      },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
      { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
      { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  })
  class TestAppModule {}

  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('sucess scenarios', () => {
    describe('health check', () => {
      it('should get heatlh check - GET /games/health', async () => {
        await request(app.getHttpServer()).get('/health').send().expect(200);
      });
    });

    describe('get current round', () => {
      it('should get current round  - GET /rounds/history', async () => {
        mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(currentRound);
        const { body, status } = await request(app.getHttpServer()).get('/rounds/current');
        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.bets.length).toBe(currentRound.bets.length);
        expect(body.data.multiplier).toBe(currentRound.multiplier);
      });

      it("should throw error if can't find current round - GET /rounds/current", async () => {
        mockRoundRepository.findCurrentBettingRound.mockResolvedValueOnce(null);
        const { body, status } = await request(app.getHttpServer()).get('/rounds/current');
        expect(status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Nenhuma rodada ativa');
        expect(body.error.type).toBe('NotFound');
      });

      it('should throw error if searching round fail - GET /rounds/history', async () => {
        mockRoundRepository.findRoundsHistory.mockRejectedValue(new Error('Database connection failed'));
        const { body, status } = await request(app.getHttpServer()).get('/rounds/history');
        expect(status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Internal server error');
        expect(body.error.type).toBe('InternalError');
      });
    });

    describe('round history', () => {
      it('should get round history without params - GET /rounds/history', async () => {
        const rounds = [currentRound] as Round[];
        mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([rounds, 1]);
        const { body, status } = await request(app.getHttpServer()).get('/rounds/history');
        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data.length).toBe(1);
        expect(body.data.total).toBe(rounds.length);
        expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(1, 20); //valores padrão
      });

      it('should get round history with params - GET /rounds/history?page=2&limit=10', async () => {
        const rounds = [currentRound] as Round[];
        const page = 2;
        const limit = 10;
        mockRoundRepository.findRoundsHistory.mockResolvedValueOnce([rounds, 1]);
        const { body, status } = await request(app.getHttpServer()).get(`/rounds/history?page=${page}&limit=${limit}`);

        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data.length).toBe(1);
        expect(body.data.total).toBe(rounds.length);
        expect(mockRoundRepository.findRoundsHistory).toHaveBeenCalledWith(page, limit); //valores padrão
      });
    });

    describe('verify round', () => {
      it('should verify round - GET rounds/:roundId/verify', async () => {
        mockProvablyFairService.getProvablyFairDataForRound.mockResolvedValueOnce({
          id: 'id',
          serverSeed: 'serverSeed',
          clientSeed: 'clientSeed',
          nonce: 1,
          serverSeedHash: 'serverSeedHash',
          createdAt: new Date(),
          usedAt: null,
          isUsed: false,
        });
        const { body, status } = await request(app.getHttpServer()).get(`/rounds/${currentRound.id}/verify`);

        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.fairId).toBe(currentRound.id);
        expect(body.data.serverSeed).toBe(currentRound.serverSeed);
        expect(body.data.clientSeed).toBe(currentRound.clientSeed);
        expect(body.data.nonce).toBe(currentRound.nonce);
        expect(body.data.serverSeedHash).toBe(currentRound.serverSeedHash);
      });

      it("should throw error if can't find fair - GET rounds/:roundId/verify", async () => {
        mockProvablyFairService.getProvablyFairDataForRound.mockResolvedValueOnce(null);
        const { body, status } = await request(app.getHttpServer()).get(`/rounds/${currentRound.id}/verify`);
        expect(status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Internal server error');
        expect(body.error.type).toBe('InternalError');
      });
    });

    describe('my bets', () => {
      it('should throw error if token not provided - GET /bets/me', async () => {
        const bets = [bet] as Bet[];
        mockBetRepository.findUserBetsHistory.mockResolvedValueOnce([[bets as any], 1]);
        const { body, status } = await request(app.getHttpServer()).get('/bets/me');
        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(body.success).toBe(false);
      });

      it('should get my bets without params- GET /bets/me', async () => {
        const bets = [bet];
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        mockBetRepository.findUserBetsHistory.mockResolvedValueOnce([bets, 1]);

        const token = 'token';
        const { body, status } = await request(app.getHttpServer())
          .get('/bets/me')
          .set('Authorization', `Bearer ${token}`);

        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data.length).toBe(bets.length);
      });

      it('should get my bets with params- GET /bets/me', async () => {
        const bets = [bet];
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        mockBetRepository.findUserBetsHistory.mockResolvedValueOnce([bets, 1]);

        const token = 'token';
        const { body, status } = await request(app.getHttpServer())
          .get('/bets/me?page=2&limit=10')
          .set('Authorization', `Bearer ${token}`);

        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data.length).toBe(bets.length);
        expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockRequest.user.sub, 2, 10, undefined);
      });
      it('should get my bets with all params- GET /bets/me', async () => {
        const bets = [bet];
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        mockBetRepository.findUserBetsHistory.mockResolvedValueOnce([bets, 1]);

        const token = 'token';
        const { body, status } = await request(app.getHttpServer())
          .get('/bets/me?page=2&limit=10&status=lost')
          .set('Authorization', `Bearer ${token}`);

        expect(status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data.length).toBe(bets.length);
        expect(mockBetRepository.findUserBetsHistory).toHaveBeenCalledWith(mockRequest.user.sub, 2, 10, 'lost');
      });
    });

    describe('bet game', () => {
      it('should throw error if token not provided - POST /bet', async () => {
        const { body, status } = await request(app.getHttpServer()).post('/bet');
        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(body.success).toBe(false);
      });

      it('should throw error bad request if body is invalid - POST /bet', async () => {
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        const { body, status } = await request(app.getHttpServer())
          .post('/bet')
          .send({
            amount: 1,
            // roundId: 'roundId'
          })
          .set('Authorization', 'Bearer token');

        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(body.success).toBe(false);
      });

      it('should throw error if ronund not found - POST /bet', async () => {
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        mockRoundRepository.findByRoundId.mockResolvedValueOnce(null);
        const { body, status } = await request(app.getHttpServer())
          .post('/bet')
          .send({
            amount: 10000,
            roundId: crypto.randomUUID(),
          })
          .set('Authorization', 'Bearer token');

        expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(body.success).toBe(false);
      });

      it('should throw error if its noot in betting phase - POST /bet', async () => {
        mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
          sub: 'sub',
          preferred_username: 'preferred_username',
          email: 'email',
          email_verified: true,
          name: 'name',
          given_name: 'given_name',
          family_name: 'family_name',
        });
        mockKeycloakService.getToken.mockResolvedValueOnce({
          access_token: 'token',
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'Bearer',

          id_token: 'id_token',
          scope: 'openid profile',
          session_state: 'session_state',
          'not-before-policy': '0',
        });
        mockRoundRepository.findByRoundId.mockResolvedValueOnce({ ...currentRound, isBettingPhase: () => false });
        const { body, status } = await request(app.getHttpServer())
          .post('/bet')
          .send({
            amount: 10000,
            roundId: crypto.randomUUID(),
          })
          .set('Authorization', 'Bearer token');
        expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(body.success).toBe(false);
      });

      // it('should create bet - POST /bet', async () => {
      //   mockKeycloakService.getUserFromToken.mockResolvedValueOnce({
      //     sub: 'sub',
      //     preferred_username: 'preferred_username',
      //     email: 'email',
      //     email_verified: true,
      //     name: 'name',
      //     given_name: 'given_name',
      //     family_name: 'family_name',
      //   });
      //   mockKeycloakService.getToken.mockResolvedValueOnce({
      //     access_token: 'token',
      //     refresh_expires_in: 1800,
      //     refresh_token: 'refresh_token',
      //     expires_in: 3600,
      //     token_type: 'Bearer',

      //     id_token: 'id_token',
      //     scope: 'openid profile',
      //     session_state: 'session_state',
      //     'not-before-policy': '0',
      //   });
      //   mockWalletProxy.getUserBalance.mockResolvedValueOnce({
      //     id: 'id',
      //     userId: 'userId',
      //     balance: 10000,
      //     balanceInCents: 10000 * 100,
      //     createdAt: 'string',
      //     updatedAt: 'string',
      //   });

      //   mockRoundRepository.findByRoundId.mockResolvedValueOnce({
      //     id: 'id',
      //     isBettingPhase: jest.fn().mockReturnValueOnce(true),
      //   } as any);
      //   mockBetRepository.createBet.mockResolvedValueOnce(bet);
      //   const { body, status } = await request(app.getHttpServer())
      //     .post('/bet')
      //     .send({
      //       amount: 10000,
      //       roundId: crypto.randomUUID(),
      //     })
      //     .set('Authorization', 'Bearer token');
      //   console.log({ body, status });
      //   expect(status).toBe(HttpStatus.OK);
      //   expect(body.success).toBe(true);
      // });
    });
  });
});
