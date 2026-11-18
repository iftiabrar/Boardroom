import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { BoardsService } from "./boards.service";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto } from "./dto/board-query.dto";

import { RoomRolesGuard } from "../../common/guard/room-roles.guard";
import { RoomRoles } from "../../common/decorators/room-roles.decorator";
import { RoomRole } from "../../common/enums/room-role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";

@ApiTags("Boards")
@ApiBearerAuth()
@Controller("rooms/:roomId/boards")
@UseGuards(RoomRolesGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @RoomRoles(RoomRole.OWNER, RoomRole.EDITOR)
  create(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBoardDto,
    @Ip() ip: string,
  ) {
    return this.boardsService.createBoard(roomId, user.id, dto, ip);
  }

  @Get()
  getBoards(
    @Param("roomId") roomId: string,
    @Query() q: BoardQueryDto,
  ) {
    return this.boardsService.getBoards(roomId, q);
  }

  @Get(":boardId")
  getBoard(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
  ) {
    return this.boardsService.getBoard(roomId, boardId);
  }

  @Patch(":boardId")
  @RoomRoles(RoomRole.OWNER, RoomRole.EDITOR)
  update(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateBoardDto,
    @Ip() ip: string,
  ) {
    return this.boardsService.updateBoard(roomId, boardId, user.id, dto, ip);
  }

  @Delete(":boardId")
  @RoomRoles(RoomRole.OWNER)
  delete(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.boardsService.deleteBoard(roomId, boardId, user.id, ip);
  }
}