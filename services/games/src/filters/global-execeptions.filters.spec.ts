import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-execeptions.filters';

describe('GlobalExceptionFilter', () => {
  let globalExceptionFilter: GlobalExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: any;

  beforeEach(() => {
    globalExceptionFilter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test/endpoint',
      hash: 'test-tracing-hash-123',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Exception Handling', () => {
    it('should handle BadRequestException correctly', () => {
      // Arrange
      const exception = new BadRequestException('Invalid input data');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'BadRequest',
          message: 'Invalid input data',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle NotFoundException correctly', () => {
      // Arrange
      const exception = new NotFoundException('Resource not found');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'NotFound',
          message: 'Resource not found',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle ConflictException correctly', () => {
      // Arrange
      const exception = new ConflictException('Duplicate entry');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'Conflict',
          message: 'Duplicate entry',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle GoneException correctly', () => {
      // Arrange
      const exception = new GoneException('Resource no longer available');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.GONE);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'Gone',
          message: 'Resource no longer available',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle generic HttpException without specific type', () => {
      // Arrange
      const exception = new HttpException('Custom error', HttpStatus.FORBIDDEN);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'UnknownError',
          message: 'Custom error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle HttpException with object response', () => {
      // Arrange
      const exception = new HttpException(
        {
          message: 'Validation failed',
          errors: ['field1 is required', 'field2 is invalid'],
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'UnknownError',
          message: 'Validation failed',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle HttpException with string response', () => {
      // Arrange
      const exception = new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'UnknownError',
          message: 'Unauthorized access',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });
  });

  describe('Non-HTTP Exception Handling', () => {
    it('should handle generic Error object', () => {
      // Arrange
      const exception = new Error('Something went wrong');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'InternalError',
          message: 'Internal server error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle string exception', () => {
      // Arrange
      const exception = 'String error';

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'InternalError',
          message: 'Internal server error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle null exception', () => {
      // Arrange
      const exception = null;

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'InternalError',
          message: 'Internal server error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle undefined exception', () => {
      // Arrange
      const exception = undefined;

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'InternalError',
          message: 'Internal server error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });

    it('should handle number exception', () => {
      // Arrange
      const exception = 404;

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'InternalError',
          message: 'Internal server error',
          path: mockRequest.url,
          timestamp: expect.any(String),
        },
        tracingId: mockRequest.hash,
      });
    });
  });

  describe('Edge Cases with Request Data', () => {
    it('should handle missing hash in request', () => {
      // Arrange
      mockRequest.hash = undefined;
      const exception = new BadRequestException('Invalid input');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: undefined,
        }),
      );
    });

    it('should handle missing url in request', () => {
      // Arrange
      mockRequest.url = undefined;
      const exception = new NotFoundException('Not found');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            path: undefined,
          }),
        }),
      );
    });

    it('should handle empty request object', () => {
      // Arrange
      mockRequest = {};
      mockArgumentsHost.switchToHttp = jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      });
      const exception = new ConflictException('Conflict');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            path: undefined,
          }),
          tracingId: undefined,
        }),
      );
    });
  });

  describe('HttpException with Complex Response Objects', () => {
    it('should handle HttpException with nested message object', () => {
      // Arrange
      const exception = new HttpException(
        {
          error: {
            message: 'Deep nested error',
            code: 'ERR_001',
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Object),
          success: false,
          tracingId: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with array message', () => {
      // Arrange
      const exception = new HttpException(
        {
          message: ['error1', 'error2', 'error3'],
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: ['error1', 'error2', 'error3'],
          }),
        }),
      );
    });

    it('should handle HttpException with empty response object', () => {
      // Arrange
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error',
          }),
        }),
      );
    });
  });

  describe('Timestamp Validation', () => {
    it('should include valid ISO timestamp in response', () => {
      // Arrange
      const exception = new BadRequestException('Error');
      const beforeCall = new Date();

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = new Date(callArgs.error.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(callArgs.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Response Structure Validation', () => {
    it('should always return success false', () => {
      // Arrange
      const exceptions = [
        new BadRequestException(),
        new NotFoundException(),
        new ConflictException(),
        new GoneException(),
        new Error(),
        null,
        undefined,
        'string error',
      ];

      for (const exception of exceptions) {
        // Act
        globalExceptionFilter.catch(exception, mockArgumentsHost as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          }),
        );
      }
    });

    it('should always include error object with required fields', () => {
      // Arrange
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.error).toHaveProperty('type');
      expect(callArgs.error).toHaveProperty('message');
      expect(callArgs.error).toHaveProperty('path');
      expect(callArgs.error).toHaveProperty('timestamp');
    });

    it('should include tracingId in response', () => {
      // Arrange
      const exception = new Error('Test error');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tracingId: mockRequest.hash,
        }),
      );
    });
  });

  describe('Status Code Handling', () => {
    it('should handle HttpException with status 0 (CONTINUE)', () => {
      // Arrange
      const exception = new HttpException('Continue', HttpStatus.CONTINUE);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONTINUE);
    });

    it('should handle HttpException with status 204 (NO_CONTENT)', () => {
      // Arrange
      const exception = new HttpException('No content', HttpStatus.NO_CONTENT);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    });

    it('should handle HttpException with status 429 (TOO_MANY_REQUESTS)', () => {
      // Arrange
      const exception = new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should handle HttpException with custom status code', () => {
      // Arrange
      const exception = new HttpException('Custom status', 418); // I'm a teapot

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(418);
    });
  });

  describe('Error Type Mapping', () => {
    it('should map BadRequestException to BadRequest type', () => {
      // Arrange
      const exception = new BadRequestException();

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'BadRequest',
          }),
        }),
      );
    });

    it('should map NotFoundException to NotFound type', () => {
      // Arrange
      const exception = new NotFoundException();

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'NotFound',
          }),
        }),
      );
    });

    it('should map ConflictException to Conflict type', () => {
      // Arrange
      const exception = new ConflictException();

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'Conflict',
          }),
        }),
      );
    });

    it('should map GoneException to Gone type', () => {
      // Arrange
      const exception = new GoneException();

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'Gone',
          }),
        }),
      );
    });

    it('should map other HttpException to UnknownError type', () => {
      // Arrange
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'UnknownError',
          }),
        }),
      );
    });

    it('should map non-HttpException to InternalError type', () => {
      // Arrange
      const exception = new Error('System error');

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'InternalError',
          }),
        }),
      );
    });
  });

  describe('Message Extraction', () => {
    it('should extract message from string response', () => {
      // Arrange
      const exception = new HttpException('Custom error message', HttpStatus.BAD_REQUEST);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Custom error message',
          }),
        }),
      );
    });

    it('should extract message from object response', () => {
      // Arrange
      const exception = new HttpException({ message: 'Object error message' }, HttpStatus.BAD_REQUEST);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Object error message',
          }),
        }),
      );
    });

    it('should use default message when object response has no message', () => {
      // Arrange
      const exception = new HttpException({ code: 'ERROR' }, HttpStatus.BAD_REQUEST);

      // Act
      globalExceptionFilter.catch(exception, mockArgumentsHost as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error',
          }),
        }),
      );
    });
  });
});
