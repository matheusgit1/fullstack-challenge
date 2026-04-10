// dtos/response/round-audit-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundHistoryItemDto } from './round-history-response.dto';

export class RoundTimingDto {
  @ApiProperty() startedAt: Date;
  @ApiProperty() endedAt: Date | null | string | undefined;
  @ApiPropertyOptional() crashedAt: Date | null;
  @ApiPropertyOptional() roundDurationMs: number | null;
  @ApiPropertyOptional() roundDurationSeconds: number | null;
  @ApiProperty() estimatedCrashDurationMs: number;
  @ApiProperty() estimatedCrashDurationSeconds: number;
  @ApiPropertyOptional() timingDriftMs: number | null;
  @ApiProperty() timingIsConsistent: boolean;
  @ApiProperty() earlyTermination: boolean;
  @ApiPropertyOptional() theoreticalMaxMultiplierAtCrash: number | null;
  @ApiPropertyOptional() maxMultiplierDeviation: number | null;

  constructor(partial: RoundTimingDto) {
    Object.assign(this, partial);
  }
}

export class RoundDeterministicDto {
  @ApiProperty() seedIsUnused: boolean;
  @ApiProperty() resultIsRepeatable: boolean;
  @ApiProperty() verificationHash: string;

  constructor(partial: RoundDeterministicDto) {
    Object.assign(this, partial);
  }
}

export class RoundAuditResponseDto {
  @ApiProperty() round: RoundHistoryItemDto;
  @ApiProperty() fairId: string;
  @ApiProperty() serverSeed: string;
  @ApiProperty() serverSeedHash: string;
  @ApiProperty() clientSeed: string;
  @ApiProperty() nonce: number;
  @ApiProperty() isValid?: null | boolean;
  @ApiProperty() calculatedCrashPoin?: null | number;
  @ApiPropertyOptional() realCrashPoint: string | number | null;
  @ApiPropertyOptional() maxMultiplierReached: number | null;
  @ApiProperty() deviation: string | number;
  @ApiProperty() houseEdgePercent: number;
  @ApiProperty() formula: string;
  @ApiProperty({ type: RoundTimingDto }) timing: RoundTimingDto;
  @ApiProperty({ type: RoundDeterministicDto }) deterministicCheck: RoundDeterministicDto;

  constructor(partial: Partial<RoundAuditResponseDto>) {
    Object.assign(this, partial);
  }
}
