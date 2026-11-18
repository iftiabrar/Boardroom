import {Body, Controller, Delete, Get, HttpCode, Ip,  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { RoomRoles } from "@/common/decorators/room-roles.decorator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { RoomRole } from "@/common/enums/room-role.enum";
import { RoomRolesGuard } from "@/common/guard/room-roles.guard";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { MembersService } from "./members.service";
import { UpdateMemberRoleDto } from "./dto/room.dto";

// Every route here has :roomId, so the guard sits on the whole class
@ApiTags("Members")
@ApiBearerAuth()
@UseGuards(RoomRolesGuard)
@Controller("rooms/:roomId")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get("members")
  @ResponseMessage("Members fetched")
  list(@Param("roomId") roomId: string, @Query() q: PaginationQueryDto) {
    return this.membersService.list(roomId, q);
  }

  @Get("members/:userId")
  @ResponseMessage("Member fetched")
  findOne(
    @Param("roomId") roomId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    return this.membersService.findOne(roomId, userId);
  }

  @Patch("members/:userId")
  @RoomRoles(RoomRole.OWNER)
  @ResponseMessage("Member role updated")
  changeRole(
    @Param("roomId") roomId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.membersService.changeRole(roomId, userId, dto.role, user, ip);
  }

  @Delete("members/:userId")
  @RoomRoles(RoomRole.OWNER)
  @ResponseMessage("Member removed")
  remove(
    @Param("roomId") roomId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.membersService.remove(roomId, userId, user, ip);
  }

  @Post("leave")
  @HttpCode(200)
  @ResponseMessage("You left the room")
  leave(@Req() req: any, @CurrentUser() user: AuthUser, @Ip() ip: string) {
    return this.membersService.leave(req.roomMember, user, ip);
  }
}
