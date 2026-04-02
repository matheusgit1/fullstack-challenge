import { Injectable, Logger } from "@nestjs/common";
import * as amqp from "amqplib";
import { rabbitConfig } from "@/configs/rabbitmq.config";
import { TransactionSource } from "./rabbitmq.types";
import { TracingService } from "../tracing/tracing.service";

export interface BaseMessage {
  tracingId: string;
}

export interface CashReserveMessage extends BaseMessage {
  cashType: TransactionSource;
  userId: string;
  amount: number;
  timestamp: string;
  externalId: string;
}
export type CashinMessage = {
  cashType: TransactionSource;
  userId: string;
  multiplier: number;
  timestamp: string;
  externalId: string;
} & BaseMessage;

export type CashoutMessage = {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
} & BaseMessage;

@Injectable()
export class RabbitmqProducerService {
  private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(RabbitmqProducerService.name);
  private readonly uri: string;
  private readonly defaultQueue: string;

  constructor(private readonly tracingService: TracingService) {
    this.uri = rabbitConfig.uri;
    this.defaultQueue = rabbitConfig.queue;
  }

  async connect() {
    try {
      const connection = await amqp.connect(this.uri);
      this.channel = await connection.createChannel();
      this.logger.log("Conectado ao RabbitMQ");
    } catch (error) {
      this.logger.error("Erro ao conectar ao RabbitMQ:", error as Error);
      throw error;
    }
  }

  async publishCashout(messageToSend: CashoutMessage) {
    const tracePrefix = this.tracingService.formatTracingPrefix(
      messageToSend.tracingId,
    );

    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "cash",
      data: {
        cashType: messageToSend.cashType,
        userId: messageToSend.userId,
        externalId: messageToSend.externalId,
        timestamp: new Date().toISOString(),
        tracingId: messageToSend.tracingId, // Adiciona tracingId à mensagem
      },
    };

    try {
      await this.channel!.assertQueue(this.defaultQueue, { durable: true });
      this.sendMessage(this.defaultQueue, message);
      this.logger.log(
        `${tracePrefix} BET_LOST message enviada para userId: ${messageToSend.userId}`,
        { externalId: messageToSend.externalId },
      );
    } catch (error) {
      this.logger.error(
        `${tracePrefix} Erro ao enviar BET_LOST message`,
        error as Error,
      );
      throw error;
    }
  }

  async publishCashin(messageToSend: CashinMessage) {
    const tracePrefix = this.tracingService.formatTracingPrefix(
      messageToSend.tracingId,
    );

    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "cash",
      data: {
        cashType: messageToSend.cashType,
        userId: messageToSend.userId,
        multiplier: messageToSend.multiplier,
        externalId: messageToSend.externalId,
        timestamp: new Date().toISOString(),
        tracingId: messageToSend.tracingId,
      },
    };

    try {
      await this.channel!.assertQueue(this.defaultQueue, { durable: true });
      this.sendMessage(this.defaultQueue, message);
      this.logger.log(
        `${tracePrefix} BET_PLACED message enviada para userId: ${messageToSend.userId}`,
        {
          multiplier: messageToSend.multiplier,
          externalId: messageToSend.externalId,
        },
      );
    } catch (error) {
      this.logger.error(
        `${tracePrefix} Erro ao enviar BET_PLACED message`,
        error as Error,
      );
      throw error;
    }
  }

  async publishReserve(messageToSend: CashReserveMessage) {
    const tracePrefix = this.tracingService.formatTracingPrefix(
      messageToSend.tracingId,
    );

    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "cash",
      data: {
        cashType: TransactionSource.BET_RESERVE,
        userId: messageToSend.userId,
        amount: messageToSend.amount,
        externalId: messageToSend.externalId,
        timestamp: new Date().toISOString(),
        tracingId: messageToSend.tracingId,
      },
    };

    try {
      await this.channel!.assertQueue(this.defaultQueue, { durable: true });
      this.sendMessage(this.defaultQueue, message);
      this.logger.log(
        `${tracePrefix} BET_RESERVE message enviada para userId: ${messageToSend.userId}`,
        { amount: messageToSend.amount, externalId: messageToSend.externalId },
      );
    } catch (error) {
      this.logger.error(
        `${tracePrefix} Erro ao enviar BET_RESERVE message`,
        error as Error,
      );
      throw error;
    }
  }

  async closeConnection() {
    if (this.channel) {
      await this.channel.close();
    }
    this.logger.log("Conexão com RabbitMQ fechada");
  }

  private sendMessage(queue: string, message: any, repeat: number = 3) {
    for (let i = 0; i < repeat; i++) {
      this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
    }
  }
}
