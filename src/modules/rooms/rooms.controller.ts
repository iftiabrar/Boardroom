import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { RoomRoles } from "@/common/decorators/room-roles.decorator";
import { RoomRole } from "@/common/enums/room-role.enum";
import { RoomRolesGuard } from "@/common/guard/room-roles.guard";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto, RoomQueryDto, UpdateRoomDto } from "./dto/room.dto";

@ApiTags("Rooms")
@ApiBearerAuth()
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  
  @Post()
  @ResponseMessage("Room created")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto, @Ip() ip: string) {
    return this.roomsService.create(user, dto, ip);
  }

  @Get()
  @ResponseMessage("Rooms fetched")
  findMine(@CurrentUser() user: AuthUser, @Query() q: RoomQueryDto) {
    return this.roomsService.findMine(user, q);
  }

  @Get(":roomId")
  @UseGuards(RoomRolesGuard)
  @ResponseMessage("Room fetched")
  findOne(@Req() req: any) {
    return this.roomsService.findOne(req.room, req.roomMember);
  }

  @Patch(":roomId")
  @UseGuards(RoomRolesGuard)
  @RoomRoles(RoomRole.OWNER)
  @ResponseMessage("Room updated")
  update(
    @Req() req: any,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.roomsService.update(req.room, dto, user, ip);
  }

  
  @Delete(":roomId")
  @ResponseMessage("Room deleted")
  remove(
    @Param("roomId", ParseUUIDPipe) roomId: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.roomsService.remove(roomId, user, ip);
  }
}
