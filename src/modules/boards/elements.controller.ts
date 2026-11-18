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
import { CreateElementDto } from "./dto/create-element.dto";
import { UpdateElementDto } from "./dto/update-element.dto";
import { ElementQueryDto } from "./dto/element-query.dto";

import { RoomRolesGuard } from "../../common/guard/room-roles.guard";
import { RoomRoles } from "../../common/decorators/room-roles.decorator";
import { RoomRole } from "../../common/enums/room-role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";

@ApiTags("Board Elements")
@ApiBearerAuth()
@Controller("rooms/:roomId/boards/:boardId/elements")
@UseGuards(RoomRolesGuard)
export class ElementsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @RoomRoles(RoomRole.OWNER, RoomRole.EDITOR)
  create(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateElementDto,
    @Ip() ip: string,
  ) {
    return this.boardsService.createElement(roomId, boardId, user.id, dto, ip);
  }

  @Get()
  getElements(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @Query() q: ElementQueryDto,
  ) {
    return this.boardsService.getElements(roomId, boardId, q);
  }

  @Get(":elementId")
  getElement(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @Param("elementId") elementId: string,
  ) {
    return this.boardsService.getElement(roomId, boardId, elementId);
  }

  @Patch(":elementId")
  @RoomRoles(RoomRole.OWNER, RoomRole.EDITOR)
  update(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @Param("elementId") elementId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateElementDto,
    @Ip() ip: string,
  ) {
    return this.boardsService.updateElement(
      roomId,
      boardId,
      elementId,
      user.id,
      dto,
      ip,
    );
  }

  @Delete(":elementId")
  @RoomRoles(RoomRole.OWNER, RoomRole.EDITOR)
  delete(
    @Param("roomId") roomId: string,
    @Param("boardId") boardId: string,
    @Param("elementId") elementId: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.boardsService.deleteElement(
      roomId,
      boardId,
      elementId,
      user.id,
      ip,
    );
  }
}