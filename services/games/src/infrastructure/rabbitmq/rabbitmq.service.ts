import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);
}
