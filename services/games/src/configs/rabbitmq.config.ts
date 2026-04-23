import { INestApplication } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

export const rabbitConfig = {
  URI: process.env.RABBITMQ_URI || process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  QUEUE: 'cashin',
};

export function setupRabbitmq(app: INestApplication<any>) {
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitConfig.URI],
      queue: rabbitConfig.QUEUE,
      queueOptions: {
        durable: true,
      },
      noAck: false,
      // prefetchCount: 10,
    },
  });
}
