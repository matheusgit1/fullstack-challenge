import { User } from "./user";

declare module "express" {
  interface Request {
    user?: User;
  }
}

declare module "amqplib" {
  export interface Channel {
    assertQueue(queue: string, options?: any): Promise<void>;
    sendToQueue(queue: string, content: Buffer, options?: any): void;
  }
}
