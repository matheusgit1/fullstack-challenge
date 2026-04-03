import { Round } from "@/infrastructure/database/orm/entites/round.entity";

export interface IGameEngineService {
  startNewRound(): Promise<void>;
  runningRound(round?: Round): Promise<void>;
  endRound(round?: Round): Promise<void>;
}

export const GAME_ENGINE_SERVICE = Symbol("IGameEngineService");
