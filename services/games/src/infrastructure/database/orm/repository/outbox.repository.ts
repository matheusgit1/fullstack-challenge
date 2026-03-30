import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OutboxMessage, OutboxStatus } from "../entites/outbox.entity";

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxMessage)
    private readonly repository: Repository<OutboxMessage>,
  ) {}

  async createMessage(
    eventType: string,
    payload: Record<string, any>,
  ): Promise<OutboxMessage> {
    const message = this.repository.create({
      eventType,
      payload,
      status: OutboxStatus.PENDING,
    });
    return this.repository.save(message);
  }

  async findPendingMessages(limit: number = 100): Promise<OutboxMessage[]> {
    return this.repository.find({
      where: { status: OutboxStatus.PENDING },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  async markAsProcessed(id: string): Promise<void> {
    await this.repository.update(id, {
      status: OutboxStatus.PROCESSED,
      processedAt: new Date(),
    });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await this.repository.update(id, {
      status: OutboxStatus.FAILED,
      errorMessage,
      retryCount: () => "retry_count + 1",
    });
  }
}
