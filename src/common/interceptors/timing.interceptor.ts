import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";

// Adds an X-Response-Time header to every response
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    const res = ctx.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(() => res.setHeader("X-Response-Time", Date.now() - start + "ms")),
    );
  }
}
