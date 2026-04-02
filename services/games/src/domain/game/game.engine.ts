export interface IGameEngineService {
  startNewRound(): Promise<void>;
}

export const GAME_ENGINE_SERVICE = Symbol("IGameEngineService");
