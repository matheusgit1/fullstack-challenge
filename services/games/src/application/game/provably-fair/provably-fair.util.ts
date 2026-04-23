import { provablyFairConfig } from '@/configs/provably-fair.config';
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

const { GROWTH_K } = provablyFairConfig;

@Injectable()
export class ProvablyFairUtil {
  calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number, houseEdgePercent: number): number {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const hex = hash.substring(0, 13);
    const int = parseInt(hex, 16);
    const max = Math.pow(2, 52);
    const crashPoint = (max / (int + 1)) * (1 - houseEdgePercent / 100);
    return Math.floor(Math.max(1, crashPoint) * 100) / 100;
  }

  calculateTimeToCrashMs(crashPoint: number): number {
    if (crashPoint <= 1) return 0;
    return (Math.log(crashPoint) / GROWTH_K) * 1000;
  }

  interpolateMultiplier(startedAt: Date, crashedAt: Date, crashPoint: number, atTime: Date): number {
    const startTime = startedAt.getTime();
    const crashTime = crashedAt.getTime();
    const t = atTime.getTime();

    if (t <= startTime || t >= crashTime) return 1.0;

    const totalDuration = crashTime - startTime;
    const elapsed = t - startTime;
    const progress = elapsed / totalDuration;
    const interpolated = 1.0 + (crashPoint - 1.0) * progress;
    return Math.round(Math.min(interpolated, crashPoint) * 100) / 100;
  }


  buildFormula(serverSeed: string, clientSeed: string, nonce: number, houseEdgePercent: number): string {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const hex = hash.substring(0, 13);
    const int = parseInt(hex, 16);
    const max = Math.pow(2, 52);
    const edge = 1 - houseEdgePercent / 100;

    return [
      `combined   = "${combined}"`,
      `sha256     = "${hash}"`,
      `hex13      = "${hex}"`,
      `H          = ${int}`,
      `max        = 2^52 = ${max}`,
      `edge       = 1 - ${houseEdgePercent}% = ${edge}`,
      `crashPoint = floor(max / (H + 1) * edge * 100) / 100`,
      `           = floor(${max} / ${int + 1} * ${edge} * 100) / 100`,
      `timeToCrash (s) = ln(crashPoint) / k = ln(?) / ${GROWTH_K}`,
    ].join('\n');
  }
}
