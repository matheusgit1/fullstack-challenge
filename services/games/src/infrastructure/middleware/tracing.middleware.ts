import { HashGeneratorUtil } from "@/util/hash-generator.util";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { type Request, Response, NextFunction } from "express";

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req.hash = HashGeneratorUtil.generate();
    next();
  }
}
