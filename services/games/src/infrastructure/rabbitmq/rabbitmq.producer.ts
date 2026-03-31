import { Injectable, Logger } from "@nestjs/common";
import * as amqp from "amqplib";
import { rabbitConfig } from "configs/rabbitmq.config";
import { TransactionSource } from "./rabbitmq.types";

export interface CashMessage {
  cashType: TransactionSource;
  userId: string;
  amount: number;
  timestamp: string;
  externalId: string;
}
@Injectable()
export class RabbitmqProducerService {
  private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(RabbitmqProducerService.name);
  private readonly uri: string;
  private readonly defaultQueue: string;

  constructor() {
    this.uri = rabbitConfig.uri;
    this.defaultQueue = rabbitConfig.queue;
  }

  async connect() {
    try {
      const connection = await amqp.connect(this.uri);
      this.channel = await connection.createChannel();
      this.logger.log("✅ Conectado ao RabbitMQ");
    } catch (error) {
      this.logger.error("❌ Erro ao conectar ao RabbitMQ:", error as Error);
      throw error;
    }
  }

  async publishCash(messageToSend: CashMessage) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "cash",
      data: {
        cashType: messageToSend.cashType,
        userId: messageToSend.userId,
        amount: messageToSend.amount,
        externalId: messageToSend.externalId,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await this.channel!.assertQueue(this.defaultQueue, { durable: true });
      this.channel!.sendToQueue(
        this.defaultQueue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true },
      );
      this.logger.log("📤 Cash message enviada:", message);
    } catch (error) {
      this.logger.error("❌ Erro ao enviar Cash message:", error as Error);
      throw error;
    }
  }

  async closeConnection() {
    if (this.channel) {
      await this.channel.close();
    }
    this.logger.log("Conexão com RabbitMQ fechada");
  }
}
