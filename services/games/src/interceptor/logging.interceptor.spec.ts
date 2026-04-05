import { type CallHandler, ExecutionContext } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { Observable, of } from 'rxjs';
import { type Request } from 'express';

describe('LoggingInterceptor', () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as any;
  const interceptor = new LoggingInterceptor();
  interceptor['logger'] = logger;

  let mockRequest: Partial<Request> = {};
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
      getResponse: jest.fn(),
    }),
    getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
    getHandler: jest.fn().mockReturnValue({ name: 'testMethod' }),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      hash: 'test-hash-123',
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      query: {},
      params: {},
    };

    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
    });
  });

  describe('Success Scenarios', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should return an observable from intercept method', () => {
      mockCallHandler.handle.mockReturnValue(of('test-data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should call handle method from call handler', () => {
      mockCallHandler.handle.mockReturnValue(of('test-data'));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should pass through the response data unchanged', (done) => {
      const expectedData = { userId: 1, name: 'John Doe' };
      mockCallHandler.handle.mockReturnValue(of(expectedData));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (data) => {
          expect(data).toEqual(expectedData);
          done();
        },
      });
    });

    it('should work with different types of response data', (done) => {
      const testCases = ['string data', 12345, true, null, undefined, [1, 2, 3], { nested: { object: 'value' } }];

      testCases.forEach((testData) => {
        mockCallHandler.handle.mockReturnValue(of(testData));
        const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

        result.subscribe({
          next: (data) => {
            expect(data).toBe(testData);
          },
        });
      });
      done();
    });

    it('should handle empty observable', (done) => {
      const emptyObservable = new Observable((subscriber) => {
        subscriber.complete();
      });
      mockCallHandler.handle.mockReturnValue(emptyObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        complete: () => {
          expect(true).toBeTruthy();
          done();
        },
      });
    });

    it('should handle observable with multiple emissions', (done) => {
      const emissions = [1, 2, 3, 4, 5];
      const multiObservable = new Observable((subscriber) => {
        emissions.forEach((value) => subscriber.next(value));
        subscriber.complete();
      });
      mockCallHandler.handle.mockReturnValue(multiObservable);

      const receivedValues: number[] = [];
      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (value) => {
          receivedValues.push(value);
        },
        complete: () => {
          expect(receivedValues).toEqual(emissions);
          done();
        },
      });
    });

    it('should work with request that has hash property', () => {
      mockRequest.hash = 'custom-hash-456';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with request without hash property', () => {
      mockRequest.hash = undefined;
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with empty hash string', () => {
      mockRequest.hash = '';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with different controller and method names', () => {
      mockExecutionContext.getClass = jest.fn().mockReturnValue({ name: 'UserController' });
      mockExecutionContext.getHandler = jest.fn().mockReturnValue({ name: 'createUser' });
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with controller that has no name', () => {
      mockExecutionContext.getClass = jest.fn().mockReturnValue({});
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle multiple interceptor calls sequentially', async () => {
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result1 = interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result2 = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await new Promise<void>((resolve) => {
        result1.subscribe({ complete: () => resolve() });
      });
      await new Promise<void>((resolve) => {
        result2.subscribe({ complete: () => resolve() });
      });

      expect(mockCallHandler.handle).toHaveBeenCalledTimes(2);
    });

    it('should handle hash as number', () => {
      mockRequest.hash = 12345 as any;
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with async handlers', (done) => {
      const asyncObservable = new Observable((subscriber) => {
        setTimeout(() => {
          subscriber.next('async-result');
          subscriber.complete();
        }, 10);
      });
      mockCallHandler.handle.mockReturnValue(asyncObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (data) => {
          expect(data).toBe('async-result');
        },
        complete: () => {
          done();
        },
      });
    });
  });

  describe('Failure Scenarios', () => {
    it('should handle errors from the observable stream', (done) => {
      const error = new Error('Method execution error');
      const errorObservable = new Observable(() => {
        throw error;
      });
      mockCallHandler.handle.mockReturnValue(errorObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should handle observable that throws error after emitting data', (done) => {
      const error = new Error('Error after data');
      const errorObservable = new Observable((subscriber) => {
        subscriber.next('data');
        subscriber.error(error);
      });
      mockCallHandler.handle.mockReturnValue(errorObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (data) => {
          expect(data).toBe('data');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should handle null request object', () => {
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(null),
        getResponse: jest.fn(),
      });
      mockCallHandler.handle.mockReturnValue(of('data'));

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow();
    });

    it('should handle undefined request object', () => {
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(undefined),
        getResponse: jest.fn(),
      });
      mockCallHandler.handle.mockReturnValue(of('data'));

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow();
    });

    it('should handle missing switchToHttp method', () => {
      const invalidContext = {
        switchToHttp: undefined,
        getClass: jest.fn(),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;
      mockCallHandler.handle.mockReturnValue(of('data'));

      expect(() => {
        interceptor.intercept(invalidContext, mockCallHandler);
      }).toThrow();
    });

    it('should handle call handler handle method throwing error', () => {
      const error = new Error('Handle method failed');
      mockCallHandler.handle.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(error);
    });

    it('should handle very long execution times without breaking', (done) => {
      const longExecutionObservable = new Observable((subscriber) => {
        setTimeout(() => {
          subscriber.complete();
        }, 100);
      });
      mockCallHandler.handle.mockReturnValue(longExecutionObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        complete: () => {
          expect(true).toBeTruthy();
          done();
        },
      });
    });

    it('should handle negative execution time scenario', (done) => {
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return 1000;
        return 500;
      });

      mockCallHandler.handle.mockReturnValue(of('data'));
      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        complete: () => {
          Date.now = originalDateNow;
          expect(true).toBeTruthy();
          done();
        },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null hash value', () => {
      mockRequest.hash = undefined;
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle special characters in hash', () => {
      mockRequest.hash = 'hash-with-$pecial-@chars!';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle extremely long hash values', () => {
      mockRequest.hash = 'a'.repeat(10000);
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle extremely long controller and method names', () => {
      const longName = 'a'.repeat(1000);
      mockExecutionContext.getClass = jest.fn().mockReturnValue({ name: longName });
      mockExecutionContext.getHandler = jest.fn().mockReturnValue({ name: longName });
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should handle observable that never completes', (done) => {
      const neverCompletesObservable = new Observable((subscriber) => {
        setTimeout(() => {
          subscriber.next('data');
        }, 10);
      });
      mockCallHandler.handle.mockReturnValue(neverCompletesObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      let receivedData = false;
      result.subscribe({
        next: (data) => {
          receivedData = true;
          expect(data).toBe('data');
        },
      });

      setTimeout(() => {
        expect(receivedData).toBe(true);
        done();
      }, 50);
    });

    it('should handle circular references in response data', (done) => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      mockCallHandler.handle.mockReturnValue(of(circularData));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (data) => {
          expect(data).toBe(circularData);
          expect(data.self).toBe(data);
          done();
        },
      });
    });

    it('should handle request with missing properties', () => {
      const minimalRequest = {};
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(minimalRequest),
        getResponse: jest.fn(),
      });
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should work with high concurrency', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => ({
        hash: `hash-${i}`,
      }));

      const interceptors = requests.map((req, i) => {
        const mockReq = { ...mockRequest, hash: req.hash };
        const mockCtx = {
          ...mockExecutionContext,
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(mockReq),
          }),
        } as unknown as ExecutionContext;

        const mockHandler = {
          handle: jest.fn().mockReturnValue(of(`data-${i}`)),
        };

        return interceptor.intercept(mockCtx, mockHandler);
      });

      await Promise.all(
        interceptors.map(
          (obs) =>
            new Promise<void>((resolve) => {
              obs.subscribe({ complete: () => resolve() });
            }),
        ),
      );

      expect(interceptors.length).toBe(50);
    });
  });
});
