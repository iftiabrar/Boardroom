import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Room } from "./entities/room.entity";
import { Repository } from "typeorm";
import { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto";


@Injectable()
export class RoomService {
constructor(
  @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
) {}

async getRooms() {
try {
  const rooms = await this.roomRepository.find();
  return rooms;}
  catch (error) {
    throw error;
}
}

async createRoom(dto: CreateRoomDto) {
try{
  const responce = await this.roomRepository.create(dto);
  return await this.roomRepository.save(responce);
}
catch (error) {
  throw error;
}}

async updateRoom(id: string, dto: UpdateRoomDto) {
  try{
    console.log("id",id);
    if (!id) {
      throw new NotFoundException("Room with ID not found");
    }
    const room = await this.roomRepository.findOne({ where: { id:id } });
    if (!room) {
      throw new NotFoundException("Room with ID not found");
    }
    Object.assign(room, dto);
    const {id: uid, ...rest}=room;
    return await this.roomRepository.update({id:id}, rest);
  } 
  catch(error){
    throw error;
  }
}

async deleteRoom(id: string) {
  try{
  const room = await this.roomRepository.findOne({ where: { id:id } });
if (!room) {
  throw new NotFoundException("Room with ID not found");  
}
return await this.roomRepository.delete({id:id});
  }
  catch(error){
    throw error;
  }
}

//async findOneByEmail(email: string): Promise<Room | null> {
 // try{
  //  const room = await this.roomRepository.findOne({ where: { email:email } });
  //  return room;
 // }
  //catch(error){
  //  throw error;
  //}

}
