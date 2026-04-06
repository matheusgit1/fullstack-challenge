import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function BaseSuccessResponseDto<T>(classRef: Type<T>) {
  class ResponseDto {
    @ApiProperty({ example: true })
    success: boolean = true;

    @ApiProperty({ type: classRef })
    data: T;

    @ApiProperty({ example: '9453d54fceecd4d90d' })
    tracingId: string;

    @ApiProperty({ example: '2026-04-02T14:46:45.935Z' })
    timestamp: string;
  }

  return ResponseDto;
}
