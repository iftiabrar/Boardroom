import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "@/src/app.module";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "@/common/interceptors/response.interceptor";
import { TimingInterceptor } from "@/common/interceptors/timing.interceptor";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TimingInterceptor(), new ResponseInterceptor(app.get(Reflector)));

  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger UI needs 'unsafe-inline' to function correctly
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "validator.swagger.io"], // Allow Swagger images
          connectSrc: ["'self'"],
        },
      },
      // This policy can block Swagger assets, so we disable it for now
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 1. Logger: moved to RequestLoggerMiddleware (applied in AppModule)

  // 2. Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("BoardRoom API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // 3. Cookie Parser
  const cookieSecret =
    process.env.COOKIE_SECRET || "fallback-secret-dont-use-in-prod";
  app.use(cookieParser(cookieSecret));

  // 4. CORS Configuration
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    maxAge: 86400,
  });

  await app.listen(parseInt(process.env.PORT as string));
}
bootstrap();
