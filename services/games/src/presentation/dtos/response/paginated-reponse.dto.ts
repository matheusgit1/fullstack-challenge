import { ApiProperty } from "@nestjs/swagger";

export class PaginatedResponseDto<T> {
  public constructor(partial: PaginatedResponseDto<T>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  data: T[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
