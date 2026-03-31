import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

@Injectable()
export class RabbitmqProducerService {
  private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(RabbitmqProducerService.name);
  private readonly uri: string;
  private readonly defaultQueue: string;

  constructor(private configService: ConfigService) {
    this.uri =
      this.configService.get("RABBITMQ_URI") ||
      "amqp://admin:admin@localhost:5672";
    this.defaultQueue = this.configService.get("RABBITMQ_QUEUE") || "cashin";
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

  async publishBetPlaced(
    userId: string,
    betAmount: number,
    gameType: string,
    externalId: string,
  ) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "game.bet.placed",
      data: {
        userId,
        betAmount,
        gameType,
        externalId,
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
      this.logger.log("📤 Aposta enviada:", message);
    } catch (error) {
      this.logger.error("❌ Erro ao enviar aposta:", error as Error);
      throw error;
    }
  }

  async publishGameResult(
    userId: string,
    gameType: string,
    resultAmount: number,
    betAmount: number,
    externalId: string,
    isWon: boolean,
  ) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "game.result",
      data: {
        userId,
        gameType,
        resultAmount,
        betAmount,
        externalId,
        isWon,
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
      this.logger.log("📤 Resultado do jogo enviado:", message);
    } catch (error) {
      this.logger.error("❌ Erro ao enviar resultado do jogo:", error as Error);
      throw error;
    }
  }

  async publishWithdraw(userId: string, amount: number, externalId: string) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "wallet.withdraw",
      data: {
        userId,
        amount,
        externalId,
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
      this.logger.log("📤 Saque enviado:", message);
    } catch (error) {
      this.logger.error("❌ Erro ao enviar saque:", error as Error);
      throw error;
    }
  }

  async publishDeposit(userId: string, amount: number, externalId: string) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "wallet.deposit",
      data: {
        userId,
        amount,
        externalId,
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
      this.logger.log("📤 Depósito enviado:", message);
    } catch (error) {
      this.logger.error("❌ Erro ao enviar depósito:", error as Error);
      throw error;
    }
  }

  async publishCash(
    cashType: string,
    userId: string,
    amount: number,
    externalId: string,
  ) {
    if (!this.channel) {
      await this.connect();
    }

    const message = {
      pattern: "cash",
      data: {
        cashType,
        userId,
        amount,
        externalId,
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
