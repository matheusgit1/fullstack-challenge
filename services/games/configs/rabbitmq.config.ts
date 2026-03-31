import { INestApplication } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";

export const rabbitConfig = {
  uri:
    process.env.RABBITMQ_URI ||
    process.env.RABBITMQ_URL ||
    "amqp://admin:admin@localhost:5672",
  queue: process.env.RABBITMQ_QUEUE || "cashin",
};

export function setupMicroservices(app: INestApplication<any>) {
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitConfig.uri],
      queue: rabbitConfig.queue,
      queueOptions: {
        durable: true,
      },
      noAck: false,
      prefetchCount: 10,
    },
  });
}
