import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { type Request } from "express";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { hash } = request;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        tracingId: hash,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
