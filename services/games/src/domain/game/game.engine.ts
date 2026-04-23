import { GameEvent } from '@/application/game/game-engine/game-engine.service';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';

export interface IGameEngineService {
  startNewRound(): Promise<void>;
  runningRound(round: Round): Promise<void>;
  endRound(round: Round): Promise<void>;
  updateRound(activeRound: Round, event?: GameEvent): Promise<void>;
}

export const GAME_ENGINE_SERVICE = Symbol('IGameEngineService');
