import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";


@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);

  formatTracingPrefix(tracingId: string): string {
    return `[TRACE:${tracingId.substring(0, 8)}]`;
  }
}
