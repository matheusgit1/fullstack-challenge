import { ExecutionContext } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor';
import { Observable, of } from 'rxjs';
import { Request } from 'express';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  let mockRequest: Partial<Request> = {};
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
      getResponse: jest.fn(),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(20 * 1000);

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

    it('should transform response data to standard format', (done) => {
      const originalData = { userId: 1, name: 'John Doe' };
      mockCallHandler.handle.mockReturnValue(of(originalData));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData).toEqual({
            success: true,
            data: originalData,
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
          done();
        },
      });
    });

    it('should work with different types of response data', (done) => {
      const testCases = ['string data', 12345, true, null, [1, 2, 3], { nested: { object: 'value' } }];

      let completed = 0;
      testCases.forEach((testData) => {
        mockCallHandler.handle.mockReturnValue(of(testData));
        const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

        result.subscribe({
          next: (transformedData) => {
            expect(transformedData).toEqual({
              success: true,
              data: testData,
              tracingId: 'test-hash-123',
              timestamp: expect.any(String),
            });
          },
          complete: () => {
            completed++;
            if (completed === testCases.length) {
              done();
            }
          },
        });
      });
    });

    it('should include current timestamp in ISO format', (done) => {
      const beforeTime = new Date().toISOString();
      mockCallHandler.handle.mockReturnValue(of('test-data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          const afterTime = new Date().toISOString();
          expect(transformedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          done();
        },
      });
    });

    it('should work with request that has hash property', (done) => {
      mockRequest.hash = 'custom-hash-456';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBe('custom-hash-456');
          done();
        },
      });
    });

    it('should work with request without hash property', (done) => {
      mockRequest.hash = undefined;
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBeUndefined();
          done();
        },
      });
    });

    it('should work with empty hash string', (done) => {
      mockRequest.hash = '';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBe('');
          done();
        },
      });
    });

    it('should work with hash as number', (done) => {
      mockRequest.hash = 12345 as any;
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBe(12345);
          done();
        },
      });
    });

    it('should handle empty observable', (done) => {
      const emptyObservable = new Observable((subscriber) => {
        subscriber.complete();
      });
      mockCallHandler.handle.mockReturnValue(emptyObservable);

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      let completed = false;
      result.subscribe({
        next: () => {
          // Should not be called
          expect(true).toBe(false);
        },
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
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

      const receivedValues: any[] = [];
      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (value) => {
          receivedValues.push(value);
        },
        complete: () => {
          expect(receivedValues).toHaveLength(5);
          receivedValues.forEach((value, index) => {
            expect(value).toEqual({
              success: true,
              data: emissions[index],
              tracingId: 'test-hash-123',
              timestamp: expect.any(String),
            });
          });
          done();
        },
      });
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
          expect(data).toEqual({
            success: true,
            data: 'async-result',
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
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

      let receivedData = false;
      result.subscribe({
        next: (data) => {
          receivedData = true;
          expect(data).toEqual({
            success: true,
            data: 'data',
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
        },
        error: (err) => {
          expect(receivedData).toBe(true);
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
  });

  describe('Edge Cases', () => {
    it('should handle special characters in hash', (done) => {
      mockRequest.hash = 'hash-with-$pecial-@chars!';
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBe('hash-with-$pecial-@chars!');
          done();
        },
      });
    });

    it('should handle extremely long hash values', (done) => {
      mockRequest.hash = 'a'.repeat(10000);
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBe(mockRequest.hash);
          done();
        },
      });
    });

    it('should handle undefined data from handler', (done) => {
      mockCallHandler.handle.mockReturnValue(of(undefined));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData).toEqual({
            success: true,
            data: undefined,
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
          done();
        },
      });
    });

    it('should handle null data from handler', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData).toEqual({
            success: true,
            data: null,
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
          done();
        },
      });
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
          expect(data).toEqual({
            success: true,
            data: 'data',
            tracingId: 'test-hash-123',
            timestamp: expect.any(String),
          });
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
        next: (transformedData) => {
          expect(transformedData.success).toBe(true);
          expect(transformedData.data).toBe(circularData);
          expect(transformedData.data.self).toBe(transformedData.data);
          done();
        },
      });
    });

    it('should handle request with missing properties', (done) => {
      const minimalRequest = {};
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(minimalRequest),
        getResponse: jest.fn(),
      });
      mockCallHandler.handle.mockReturnValue(of('data'));

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result.subscribe({
        next: (transformedData) => {
          expect(transformedData.tracingId).toBeUndefined();
          done();
        },
      });
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

    it('should preserve the success flag as true always', (done) => {
      const testDataList = ['string', 123, { complex: 'object' }, ['array', 'data'], true, false, null, undefined];

      let completed = 0;
      testDataList.forEach((testData) => {
        mockCallHandler.handle.mockReturnValue(of(testData));
        const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

        result.subscribe({
          next: (transformedData) => {
            expect(transformedData.success).toBe(true);
          },
          complete: () => {
            completed++;
            if (completed === testDataList.length) {
              done();
            }
          },
        });
      });
    });
  });
});
