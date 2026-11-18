import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import { STATUS_CODES } from "http";
import { QueryFailedError } from "typeorm";

// One error shape for the whole API:
// { success: false, statusCode, error, message, path, timestamp }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message: string | string[] = "Something went wrong. Please try again.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      message = typeof body === "string" ? body : body.message ?? exception.message;
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as any).driverError?.code;
      if (code === "23505") {
        status = 409;
        message = "A record with this value already exists";
      } else if (code === "23503") {
        status = 409;
        message = "The related record does not exist or is still in use";
      } else if (code === "22P02") {
        status = 400;
        message = "Invalid id or value format";
      } else {
        console.error(exception);
      }
    } else {
      console.error(exception);
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      error: STATUS_CODES[status] ?? "Error",
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
