import { TracingMiddleware } from './tracing.middleware';
import { HashGeneratorUtil } from '@/util/hash-generator.util';
import { Request, Response, NextFunction } from 'express';

describe('TracingMiddleware', () => {
  let middleware: TracingMiddleware;

  const mockNext: NextFunction = jest.fn();
  const mockResponse = {} as Response;

  beforeAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    middleware = new TracingMiddleware();
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should add hash to request and call next', () => {
      const mockRequest = {} as Request;

      jest.spyOn(HashGeneratorUtil, 'generate').mockReturnValue('hash-123');

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(HashGeneratorUtil.generate).toHaveBeenCalled();
      expect(mockRequest.hash).toBe('hash-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should override existing hash if present', () => {
      const mockRequest = { hash: 'old-hash' } as Request;

      jest.spyOn(HashGeneratorUtil, 'generate').mockReturnValue('new-hash');

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.hash).toBe('new-hash');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('failure scenarios', () => {
    it('should throw if hash generator fails', () => {
      const mockRequest = {} as Request;

      jest.spyOn(HashGeneratorUtil, 'generate').mockImplementation(() => {
        throw new Error('Hash error');
      });

      expect(() => middleware.use(mockRequest, mockResponse, mockNext)).toThrow('Hash error');
    });

    it('should not call next if error occurs', () => {
      const mockRequest = {} as Request;

      jest.spyOn(HashGeneratorUtil, 'generate').mockImplementation(() => {
        throw new Error('Hash error');
      });

      try {
        middleware.use(mockRequest, mockResponse, mockNext);
      } catch {}

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
