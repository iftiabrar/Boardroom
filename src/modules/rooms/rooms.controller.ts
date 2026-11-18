import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { RoomService } from "./rooms.service";
import { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto";

@Controller("rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getRooms() {
    return await this.roomService.getRooms();
  }

  @Post()
  async createRoom(@Body() dto: CreateRoomDto) {
    return await this.roomService.createRoom(dto);
  }

  @Patch(":id")
  async updateRoom(@Param("id") id: string, @Body() dto: UpdateRoomDto) {
    return await this.roomService.updateRoom(id, dto);
  }

  @Delete(":id")
  async deleteRoom(@Param("id") id: string) {
    return await this.roomService.deleteRoom(id);
  }
}