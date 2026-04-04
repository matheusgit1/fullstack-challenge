import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloack.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('KeycloakModule', () => {
  let service: KeycloakService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(KeycloakService);
    httpService = module.get(HttpService);
  });

  it('should get user from token', async () => {
    const mockResponse = {
      data: {
        sub: '123',
        email: 'test@test.com',
      },
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

    const result = await service.getUserFromToken('token');

    expect(result).toEqual(mockResponse.data);
  });
});
