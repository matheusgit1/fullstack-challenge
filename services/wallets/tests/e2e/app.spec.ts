import { WalletRepository } from '@/infrastructure/database/orm/repository/wallet.repository';
import { WalletsService } from './../../src/presentation/services/wallets.service';
import { WalletsController } from '@/presentation/controllers/wallets.controller';
import { HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IWalletRepository, WALLET_REPOSITORY } from '@/domain/orm/repositories/wallet.repository';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, REQUEST } from '@nestjs/core';
import { AuthGuard } from '@/application/auth/auth.guard';
import { GlobalExceptionFilter } from '@/filters/global-execeptions.filters';
import { LoggingInterceptor } from '@/interceptor/logging.interceptor';
import { Test } from '@nestjs/testing';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '@/domain/orm/repositories/transaction.repository';
import { IKeyCloakService, KEYCLOACK_PROVIDER } from '@/domain/keycloack/keycloack.service';
import request from 'supertest';
import { AuthModule } from '@/application/auth/auth.module';
import { ResponseInterceptor } from '@/interceptor/response.interceptor';

describe('App e2e', () => {
  const mockKeyCloakService: jest.Mocked<IKeyCloakService> = {
    getUserFromToken: jest.fn(),
    getToken: jest.fn(),
  };
  const mockTransactionRepository: jest.Mocked<ITransactionRepository> = {
    findByExternalIdAndSource: jest.fn(),
    processTransaction: jest.fn(),
  };
  const mockWalletRepository: jest.Mocked<IWalletRepository> = {
    createWallet: jest.fn(),
    findOrCreate: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    getTransactionByExternalId: jest.fn(),
  };
  @Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
    controllers: [WalletsController],
    providers: [
      WalletsService,
      { provide: KEYCLOACK_PROVIDER, useValue: mockKeyCloakService },
      { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
      { provide: REQUEST, useValue: { user: { sub: '1' }, hash: 'hash', token: 'token' } },
      { provide: WALLET_REPOSITORY, useValue: mockWalletRepository },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
      { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
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

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should return an array of wallets', async () => {
    // const response = await app.get('/wallets').expect(200);
    await request(app.getHttpServer()).get('/health').send().expect(200);
  });

  it('should throw error if token not provided - GET /wallets', async () => {
    const { body, status } = await request(app.getHttpServer()).get('/me');
    expect(status).toBe(HttpStatus.FORBIDDEN);
    expect(body.success).toBe(false);
  });

  it("should create a wallet if it doesn't exist", async () => {
    mockKeyCloakService.getUserFromToken.mockResolvedValueOnce({
      sub: 'sub',
      preferred_username: 'preferred_username',
      email: 'email',
      email_verified: true,
      name: 'name',
      given_name: 'given_name',
      family_name: 'family_name',
    });
    mockKeyCloakService.getToken.mockResolvedValueOnce({
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
    mockWalletRepository.findOrCreate.mockResolvedValueOnce({
      id: 'id',
      userId: 'sub',
      balanceInCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      getBalance: () => 1000,
      setBalance: (_: number) => {},
      canDebit: () => true,
      debit: () => {},
      credit: () => {},
    });
    const { body, status } = await request(app.getHttpServer()).get('/me').set('Authorization', 'Bearer token');
    expect(status).toBe(HttpStatus.OK);
    expect(body.success).toBe(true);
  });

  it("should create a wallet if it doesn't exist", async () => {
    mockKeyCloakService.getUserFromToken.mockResolvedValueOnce({
      sub: 'sub',
      preferred_username: 'preferred_username',
      email: 'email',
      email_verified: true,
      name: 'name',
      given_name: 'given_name',
      family_name: 'family_name',
    });
    mockKeyCloakService.getToken.mockResolvedValueOnce({
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
    mockWalletRepository.findOrCreate.mockResolvedValueOnce({
      id: 'id',
      userId: 'sub',
      balanceInCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      getBalance: () => 1000,
      setBalance: (_: number) => {},
      canDebit: () => true,
      debit: () => {},
      credit: () => {},
    });
    mockWalletRepository.createWallet.mockResolvedValueOnce({
      id: 'id',
      userId: 'sub',
      balanceInCents: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      getBalance: () => 1000,
      setBalance: (_: number) => {},
      canDebit: () => true,
      debit: () => {},
      credit: () => {},
    });
    const { body, status } = await request(app.getHttpServer()).post('/').set('Authorization', 'Bearer token').send({});
    expect(status).toBe(HttpStatus.CREATED);
    expect(body.success).toBe(true);
  });
});
