import {
  CashoutMessage,
  RabbitmqProducerService,
} from "@/infrastructure/rabbitmq/rabbitmq.producer";
import { BetRepository } from "@/infrastructure/database/orm/repository/bet.repository";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { TransactionSource } from "../rabbitmq/rabbitmq.types";
import { BetStatus } from "@/presentation/dtos";
import { Bet } from "../database/orm/entites/bet.entity";

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  connectedAt: Date;
}

@WebSocketGateway({
  path: "/ws",
  transports: ["websocket"],
  cors: {
    origin: "*",
  },
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clients: Map<string, ConnectedClient> = new Map();

  public constructor(
    private readonly betRepository: BetRepository,
    private readonly rabbitmqProducerService: RabbitmqProducerService,
  ) {}

  handleConnection(client: WebSocket, req: Request) {
    const clientId = this.generateClientId();

    this.clients.set(clientId, {
      ws: client,
      id: clientId,
      connectedAt: new Date(),
    });

    this.logger.log(`Client connected: ${clientId}`);

    client.send(
      JSON.stringify({
        type: "connection",
        status: "connected",
        clientId: clientId,
        message: "Successfully connected to WebSocket server",
        timestamp: new Date().toISOString(),
      }),
    );
  }

  handleDisconnect(client: WebSocket) {
    const disconnectedClient = Array.from(this.clients.entries()).find(
      ([_, value]) => value.ws === client,
    );

    if (disconnectedClient) {
      const [clientId] = disconnectedClient;
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  @SubscribeMessage("ping")
  handlePing(client: WebSocket, data: any) {
    client.send(
      JSON.stringify({
        type: "pong",
        data: data,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  sendToClient(clientId: string, event: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(
        JSON.stringify({
          type: event,
          data: data,
          timestamp: new Date().toISOString(),
        }),
      );
      return true;
    }
    return false;
  }

  broadcast(event: string, data: any) {
    const message = JSON.stringify({
      type: event,
      data: data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  @OnEvent("betting.running")
  handleNewBetting(payload: any) {
    this.logger.log(`betting.running received`);
    this.broadcast("betting.running", payload);
  }

  @OnEvent("multiplier.updated")
  handleMultiplyIncrease(payload: any) {
    this.logger.log(`multiplier.updated received`);
    this.broadcast("multiplier.updated", payload);
  }

  @OnEvent("betting.loose")
  async handleGameLoose(payload: { roundId: string; tracingId: string }) {
    this.logger.log(
      `[Trace:${payload.tracingId}] betting.loose received`,
      payload,
    );

    const betLoosers = await this.betRepository.findLooserBetsByRoundId(
      payload.roundId,
    );

    this.logger.log(
      `[Trace:${payload.tracingId}] Found ${betLoosers.length} pending bets to update`,
    );
    for (const bet of betLoosers) {
      this.logger.log(`[Trace:${payload.tracingId}] Updating bet ${bet.id}`);
      const saveBetPromise = this.betRepository.save(
        new Bet({ ...bet, status: BetStatus.LOST }),
      );
      const notifyRabbitMqCashoutPromise = this.notifyRabbitMqCashout({
        cashType: TransactionSource.BET_LOST,
        userId: bet.userId,
        timestamp: new Date().toISOString(),
        externalId: bet.id,
        tracingId: payload.tracingId,
      });

      await Promise.all([saveBetPromise, notifyRabbitMqCashoutPromise]);
    }

    this.broadcast("betting.loose", {
      ...payload,
      data: { ...payload, bets: betLoosers.map((bet) => bet.id) },
    });
  }

  @OnEvent("betting.crashed")
  async handleGameCrashed(payload: any) {
    this.logger.log(
      `[Trace:${payload.tracingId}] betting.crashed received`,
      payload,
    );

    const betLoosers = await this.betRepository.findLooserBetsByRoundId(
      payload.roundId,
    );

    this.logger.log(
      `[Trace:${payload.tracingId}] Found ${betLoosers.length} pending bets to update`,
    );
    for (const bet of betLoosers) {
      this.logger.log(`[Trace:${payload.tracingId}] Updating bet ${bet.id}`);
      const saveBetPromise = this.betRepository.save(
        new Bet({ ...bet, status: BetStatus.LOST }),
      );
      const notifyRabbitMqCashoutPromise = this.notifyRabbitMqCashout({
        cashType: TransactionSource.BET_LOST,
        userId: bet.userId,
        timestamp: new Date().toISOString(),
        externalId: bet.id,
        tracingId: payload.tracingId,
      });

      await Promise.all([saveBetPromise, notifyRabbitMqCashoutPromise]);
    }
    this.broadcast("betting.crashed", payload);
  }

  @OnEvent("round.betting.started")
  handleNewRound(payload: any) {
    this.logger.log(`round.betting.started received`);
    this.broadcast("round.betting.started", payload);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async notifyRabbitMqCashout(message: CashoutMessage) {
    await this.rabbitmqProducerService.publishCashout(message);
  }
}
