import { Injectable, NestMiddleware } from "@nestjs/common";
import { type Request, Response, NextFunction } from "express";
import { HashGeneratorUtil } from "@/util/hash-generator.util";

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction) {
    req.hash = HashGeneratorUtil.generate();
    next();
  }
}
