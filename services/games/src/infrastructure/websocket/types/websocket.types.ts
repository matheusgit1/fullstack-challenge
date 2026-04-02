import { WebSocket } from "ws";

export interface ConnectedClient {
  ws: WebSocket;
  id: string;
  connectedAt: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export enum WebSocketEvent {
  CONNECTION = "connection",
  PONG = "pong",
  BETTING_RUNNING = "betting.running",
  MULTIPLIER_UPDATED = "multiplier.updated",
  BETTING_LOOSE = "betting.loose",
  BETTING_CRASHED = "betting.crashed",
  ROUND_BETTING_STARTED = "round.betting.started",
}

export interface BettingRunningEvent {
  roundId: string;
  startTime: Date;
  [key: string]: any;
}

export interface MultiplierUpdatedEvent {
  roundId: string;
  multiplier: number;
  timestamp: Date;
}

export interface BettingLooseEvent {
  roundId: string;
  tracingId: string;
  crashedAt: number;
}

export interface BettingCrashedEvent {
  roundId: string;
  tracingId: string;
  crashedAt: number;
  finalMultiplier: number;
}
