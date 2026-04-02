import { CallHandler, Logger } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";

export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const { hash } = request;

    const metodo = `${context.getClass().name}.${context.getHandler().name}`;
    this.logger.log(`[${hash}] Executando método.`, metodo);
    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `[${hash}] Método executado em ${Date.now() - now} ms.`,
            metodo,
          ),
        ),
      );
  }
}
