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
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { MessagesService } from "./messages.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { MessageQueryDto } from "./dto/message-query.dto";

import { RoomRolesGuard } from "../../common/guard/room-roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/auth-user.interface";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("rooms/:roomId/messages")
@UseGuards(RoomRolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMessageDto,
    @Ip() ip: string,
  ) {
    return this.messagesService.create(roomId, user.id, dto, ip);
  }

  @Get()
  findAll(
    @Param("roomId") roomId: string,
    @Query() q: MessageQueryDto,
  ) {
    return this.messagesService.findAll(roomId, q);
  }

  @Get(":messageId")
  findOne(
    @Param("roomId") roomId: string,
    @Param("messageId") messageId: string,
  ) {
    return this.messagesService.findOne(roomId, messageId);
  }

  @Patch(":messageId")
  update(
    @Param("roomId") roomId: string,
    @Param("messageId") messageId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMessageDto,
    @Ip() ip: string,
  ) {
    return this.messagesService.update(roomId, messageId, user.id, dto, ip);
  }

  @Delete(":messageId")
  delete(
    @Param("roomId") roomId: string,
    @Param("messageId") messageId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const isOwner = req.roomMember?.role === "owner";

    return this.messagesService.remove(
      roomId,
      messageId,
      user.id,
      isOwner,
      ip,
    );
  }
}