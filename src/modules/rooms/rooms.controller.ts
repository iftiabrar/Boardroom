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
import { CreateUserDto } from "./dto/room.dto";

@Controller("rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getRooms() {
    return await this.roomService.getRooms();
  }

  
  @Post()
  async createRoom(@Body() dto: CreateUserDto) {
    return await this.roomService.createRoom(dto);
  }

  @Patch(":id")
  async updateRoom(@Param("id") id: string, @Body() dto: CreateUserDto) {
    return await this.roomService.updateRoom(id, dto);
  }

  @Delete(":id")
  async deleteRoom(@Param("id") id: string) {
    return await this.roomService.deleteRoom(id);
  }
}

