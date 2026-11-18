import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PostgresDatabaseProviderModule } from "@/providers/database/postgres/provider.module";
import { AppController } from "@/src/app.controller";
import { AppService } from "@/src/app.service";
import global_config from "@/config/global_config";
import { BullModule } from "@nestjs/bull";
import { JwtGuard } from "@/common/guard/jwt.guard";
import { RolesGuard } from "@/common/guard/roles.guard";
import { RequestLoggerMiddleware } from "@/common/middlewares/request-logger.middleware";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MailModule } from './mails/mail.module';
import { InvitesModule } from './modules/invites/invites.module';
import { LobbyModule } from './modules/lobby/lobby.module';
import { AuditModule } from "./modules/audit/audit.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { BoardsModule } from "./modules/boards/boards.module";
import { MessagesModule } from "./modules/messages/messages.module";

@Module({
  imports: [
    PostgresDatabaseProviderModule,
    BullModule.forRoot({
      url: process.env.REDIS_URL,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [global_config],
    }),
    AuditModule,
    AuthModule,
    UserModule,
    MailModule,
    InvitesModule,
    LobbyModule,
    RoomsModule,
    BoardsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Nest 11 syntax for "every route" (the old "*" prints a warning)
    consumer.apply(RequestLoggerMiddleware).forRoutes("{*splat}");
  }
}