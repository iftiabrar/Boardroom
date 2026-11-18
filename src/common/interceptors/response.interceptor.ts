import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map } from "rxjs";
import { RESPONSE_MESSAGE_KEY } from "../decorators/response-message.decorator";

// Wraps every success response as { success, message, data, meta }.
// If the handler returned paginate(...) ({ items, meta }), items go to data and the page details go to meta.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const message = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, ctx.getHandler()) ?? "Success";
    return next.handle().pipe(
      map((result) => {
        const isPage = result && Array.isArray(result.items) && result.meta;
        return {
          success: true,
          message,
          data: isPage ? result.items : result ?? null,
          meta: isPage ? result.meta : null,
        };
      }),
    );
  }
}
