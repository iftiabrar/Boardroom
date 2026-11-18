import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import { Message } from "./entities/message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { MessageQueryDto } from "./dto/message-query.dto";
import { paginate } from "../../common/helpers/paginate";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    private readonly auditService: AuditService,
  ) {}

  async create(
    roomId: string,
    userId: string,
    dto: CreateMessageDto,
    ip: string,
  ) {
    const message = this.messageRepository.create({
      room_id: roomId,
      sender_id: userId,
      body: dto.body,
      is_edited: false,
    });

    const saved = await this.messageRepository.save(message);

    await this.auditService.record({
      user_id: userId,
      action: "CREATE",
      entity: "messages",
      entity_id: saved.id,
      new_values: { ...saved },
      ip,
    });

    return saved;
  }

  async findAll(roomId: string, q: MessageQueryDto) {
    const where: any = {
      room_id: roomId,
    };

    if (q.before) {
      where.created_at = LessThan(new Date(q.before));
    }

    const [items, total] = await this.messageRepository.findAndCount({
      where,
      relations: {
        sender: true,
      },
      order: {
        created_at: "DESC",
      },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });

    const result = items.map((message) => ({
      id: message.id,
      room_id: message.room_id,
      sender_id: message.sender_id,
      sender_name: message.sender?.name ?? null,
      body: message.body,
      is_edited: message.is_edited,
      created_at: message.created_at,
      updated_at: message.updated_at,
    }));

    return paginate(result, total, q);
  }

  async findOne(roomId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: {
        id: messageId,
        room_id: roomId,
      },
      relations: {
        sender: true,
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return {
      id: message.id,
      room_id: message.room_id,
      sender_id: message.sender_id,
      sender_name: message.sender?.name ?? null,
      body: message.body,
      is_edited: message.is_edited,
      created_at: message.created_at,
      updated_at: message.updated_at,
    };
  }

  async update(
    roomId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
    ip: string,
  ) {
    const message = await this.messageRepository.findOne({
      where: {
        id: messageId,
        room_id: roomId,
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException("You can edit only your own message");
    }

    const oldValues = { ...message };

    message.body = dto.body;
    message.is_edited = true;

    const saved = await this.messageRepository.save(message);

    await this.auditService.record({
      user_id: userId,
      action: "UPDATE",
      entity: "messages",
      entity_id: saved.id,
      old_values: oldValues,
      new_values: { ...saved },
      ip,
    });

    return saved;
  }

  async remove(
    roomId: string,
    messageId: string,
    userId: string,
    isOwner: boolean,
    ip: string,
  ) {
    const message = await this.messageRepository.findOne({
      where: {
        id: messageId,
        room_id: roomId,
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.sender_id !== userId && !isOwner) {
      throw new ForbiddenException("You can delete only your own message");
    }

    const id = message.id;
    const oldValues = { ...message };

    await this.messageRepository.remove(message);

    await this.auditService.record({
      user_id: userId,
      action: "DELETE",
      entity: "messages",
      entity_id: id,
      old_values: oldValues,
      ip,
    });

    return {
      message: "Message deleted successfully",
    };
  }
}