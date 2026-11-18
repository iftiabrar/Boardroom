import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

// Gives every request an X-Request-Id and prints one log line when it finishes
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    res.on("finish", () => {
      console.log(
        "[HTTP] " + requestId + " " + req.method + " " + req.originalUrl + " " + res.statusCode + " " + (Date.now() - start) + "ms",
      );
    });
    next();
  }
}
