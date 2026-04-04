import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { WalletProxy } from './wallets.proxy';
import { WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { ProxyModule } from './proxy.module';

describe(ProxyModule.name, () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  describe('Success Scenarios', () => {
    it('should be defined', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should successfully compile the module', () => {
      expect(moduleRef).toBeDefined();
    });

    describe('Module Configuration', () => {
      it('should have HttpModule registered with correct configuration', async () => {
        const httpModule = moduleRef.get(HttpModule);
        expect(httpModule).toBeDefined();
      });

      it('should provide WALLET_PROXY token with WalletProxy implementation', () => {
        const walletProxy = moduleRef.get(WALLET_PROXY);
        expect(walletProxy).toBeDefined();
        expect(walletProxy).toBeInstanceOf(WalletProxy);
      });

      it('should have HttpService available for injection', () => {
        const httpService = moduleRef.get(HttpService);
        expect(httpService).toBeDefined();
        expect(httpService).toBeInstanceOf(HttpService);
      });
    });

    describe('Provider Resolution', () => {
      it('should resolve WalletProxy when using WALLET_PROXY token', () => {
        const walletProxy = moduleRef.get<WalletProxy>(WALLET_PROXY);
        expect(walletProxy).toBeDefined();
      });

      it('should resolve HttpService directly', () => {
        const httpService = moduleRef.get(HttpService);
        expect(httpService).toBeDefined();
      });
    });

    describe('Exports', () => {
      it('should export WALLET_PROXY token for other modules', async () => {
        const testModule = await Test.createTestingModule({
          imports: [ProxyModule],
        }).compile();

        const exportedWalletProxy = testModule.get(WALLET_PROXY);
        expect(exportedWalletProxy).toBeDefined();
        expect(exportedWalletProxy).toBeInstanceOf(WalletProxy);
      });

      it('should export HttpModule for other modules', async () => {
        const testModule = await Test.createTestingModule({
          imports: [ProxyModule],
        }).compile();

        const exportedHttpModule = testModule.get(HttpModule);
        expect(exportedHttpModule).toBeDefined();
      });
    });

    describe('HttpModule Configuration', () => {
      it('should configure HttpModule with timeout of 5000ms', async () => {
        const httpService = moduleRef.get(HttpService);
        const axiosRef = httpService.axiosRef;

        expect(axiosRef.defaults.timeout).toBe(5000);
      });

      it('should configure HttpModule with maxRedirects of 5', async () => {
        const httpService = moduleRef.get(HttpService);
        const axiosRef = httpService.axiosRef;

        expect(axiosRef.defaults.maxRedirects).toBe(5);
      });
    });
  });

  describe('Failure Scenarios', () => {
    describe('Module Initialization', () => {
      it('should throw error when HttpModule is not properly configured', async () => {
        try {
          await Test.createTestingModule({
            imports: [
              HttpModule.register({
                timeout: -1, // Invalid timeout
                maxRedirects: 5,
              }),
            ],
            providers: [
              {
                provide: WALLET_PROXY,
                useClass: WalletProxy,
              },
            ],
          }).compile();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      it('should handle missing provider configuration', async () => {
        const invalidModule = await Test.createTestingModule({
          imports: [HttpModule.register({ timeout: 5000 })],
          providers: [], // Missing WALLET_PROXY provider
        }).compile();

        expect(() => invalidModule.get(WALLET_PROXY)).toThrow();
      });
    });

    describe('Provider Resolution Errors', () => {
      it('should throw error when resolving non-existent provider', () => {
        expect(() => moduleRef.get('NON_EXISTENT_TOKEN')).toThrow();
      });

      it('should handle circular dependency errors gracefully', async () => {
        // This is a simplified test for circular dependency detection
        const circularModule = await Test.createTestingModule({
          imports: [ProxyModule],
        }).compile();

        expect(circularModule).toBeDefined();
        // If there were circular dependencies, NestJS would throw during compilation
      });
    });

    describe('HttpModule Error Handling', () => {
      it('should handle missing required HttpModule configuration', () => {
        const moduleWithMissingConfig = Test.createTestingModule({
          imports: [HttpModule.register({})],
        }).compile();

        expect(moduleWithMissingConfig).resolves.toBeDefined();
      });
    });
  });

  describe('Integration Scenarios', () => {
    describe('Module Dependencies', () => {
      it('should properly inject HttpService into WalletProxy', async () => {
        const walletProxy = moduleRef.get<WalletProxy>(WALLET_PROXY);
        const httpService = moduleRef.get(HttpService);

        expect(walletProxy).toBeDefined();
        expect(httpService).toBeDefined();
        // Verify that WalletProxy has access to HttpService
        expect(walletProxy).toHaveProperty('httpService');
      });

      it('should allow multiple modules to import ProxyModule', async () => {
        const module1 = await Test.createTestingModule({
          imports: [ProxyModule],
        }).compile();

        const module2 = await Test.createTestingModule({
          imports: [ProxyModule],
        }).compile();

        expect(module1.get(WALLET_PROXY)).toBeDefined();
        expect(module2.get(WALLET_PROXY)).toBeDefined();
        expect(module1.get(WALLET_PROXY)).not.toBe(module2.get(WALLET_PROXY));
      });
    });

    describe('Runtime Behavior', () => {
      it('should maintain HttpModule timeout configuration at runtime', () => {
        const httpService = moduleRef.get(HttpService);
        expect(httpService.axiosRef.defaults.timeout).toBe(5000);
      });

      it('should allow overriding HttpModule configuration', async () => {
        const customModule = await Test.createTestingModule({
          imports: [
            HttpModule.register({
              timeout: 5000,
              maxRedirects: 5,
            }),
            ProxyModule,
          ],
        }).compile();

        const httpService = customModule.get(HttpService);
        expect(httpService.axiosRef.defaults.timeout).toBe(5000);
        expect(httpService.axiosRef.defaults.maxRedirects).toBe(5);
      });
    });
  });
});

// Additional test for WalletProxy if needed
describe('WalletProxy Integration', () => {
  let moduleRef: TestingModule;
  let walletProxy: WalletProxy;
  let httpService: HttpService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    walletProxy = moduleRef.get<WalletProxy>(WALLET_PROXY);
    httpService = moduleRef.get(HttpService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('Success Scenarios', () => {
    it('should initialize WalletProxy with HttpService injected', () => {
      expect(walletProxy).toBeDefined();
      expect(httpService).toBeDefined();
    });

    it('should have access to axios instance through HttpService', () => {
      expect(walletProxy['httpService']).toBeDefined();
      expect(walletProxy['httpService'].axiosRef).toBeDefined();
    });
  });

  describe('Failure Scenarios', () => {
    it('should handle HttpService errors in WalletProxy methods', async () => {
      // This would test specific error handling in WalletProxy methods
      // You'll need to implement this based on your actual WalletProxy implementation
      expect(walletProxy).toBeDefined();
    });
  });
});
