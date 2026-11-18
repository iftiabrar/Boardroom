import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  LessThan,
  Repository,
} from "typeorm";

import { Message } from "./entities/message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { MessageQueryDto } from "./dto/message-query.dto";
import { paginate } from "../../common/helpers/paginate";

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(
    roomId: string,
    userId: string,
    dto: CreateMessageDto,
  ) {
    const message = this.messageRepository.create({
      room_id: roomId,
      sender_id: userId,
      body: dto.body,
      is_edited: false,
    });

    return this.messageRepository.save(message);
  }

  async findAll(
    roomId: string,
    q: MessageQueryDto,
  ) {
    const where: any = {
      room_id: roomId,
    };

    if (q.before) {
      where.created_at = LessThan(
        new Date(q.before),
      );
    }

    const [items, total] =
      await this.messageRepository.findAndCount({
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

  async findOne(
    roomId: string,
    messageId: string,
  ) {
    const message =
      await this.messageRepository.findOne({
        where: {
          id: messageId,
          room_id: roomId,
        },
        relations: {
          sender: true,
        },
      });

    if (!message) {
      throw new NotFoundException(
        "Message not found",
      );
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
  ) {
    const message =
      await this.messageRepository.findOne({
        where: {
          id: messageId,
          room_id: roomId,
        },
      });

    if (!message) {
      throw new NotFoundException(
        "Message not found",
      );
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException(
        "You can edit only your own message",
      );
    }

    message.body = dto.body;
    message.is_edited = true;

    return this.messageRepository.save(message);
  }

  async remove(
    roomId: string,
    messageId: string,
    userId: string,
    isOwner: boolean,
  ) {
    const message =
      await this.messageRepository.findOne({
        where: {
          id: messageId,
          room_id: roomId,
        },
      });

    if (!message) {
      throw new NotFoundException(
        "Message not found",
      );
    }

    if (
      message.sender_id !== userId &&
      !isOwner
    ) {
      throw new ForbiddenException(
        "You can delete only your own message",
      );
    }

    await this.messageRepository.remove(
      message,
    );

    return {
      message: "Message deleted successfully",
    };
  }
}