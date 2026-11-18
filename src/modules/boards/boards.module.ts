import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BoardsController } from "./boards.controller";
import { ElementsController } from "./elements.controller";
import { BoardsService } from "./boards.service";

import { Board } from "./entities/board.entity";
import { BoardElement } from "./entities/board-element.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      BoardElement,
    ]),
  ],
  controllers: [
    BoardsController,
    ElementsController,
  ],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}