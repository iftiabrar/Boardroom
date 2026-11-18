import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";

import { Board } from "./entities/board.entity";
import { BoardElement } from "./entities/board-element.entity";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto } from "./dto/board-query.dto";
import { CreateElementDto } from "./dto/create-element.dto";
import { UpdateElementDto } from "./dto/update-element.dto";
import { ElementQueryDto } from "./dto/element-query.dto";
import {
  StrokeDataDto,
  ShapeDataDto,
  TextDataDto,
  StickyNoteDataDto,
} from "./dto/element-data.dto";
import { paginate } from "../../common/helpers/paginate";
import { AuditService } from "../audit/audit.service";

const DATA_DTO: Record<string, new () => object> = {
  stroke: StrokeDataDto,
  shape: ShapeDataDto,
  text: TextDataDto,
  sticky_note: StickyNoteDataDto,
};

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(BoardElement)
    private readonly elementRepository: Repository<BoardElement>,

    private readonly auditService: AuditService,
  ) {}

  // Checks element "data" against the DTO of its type
  private checkData(type: string, data: object) {
    const dtoClass = DATA_DTO[type];
    if (!dtoClass) {
      throw new BadRequestException("Unknown element type");
    }
    const errors = validateSync(plainToInstance(dtoClass, data), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) {
      throw new BadRequestException(
        errors.flatMap((e) => Object.values(e.constraints ?? {})),
      );
    }
  }

  // -------------------------
  // BOARDS
  // -------------------------

  async createBoard(
    roomId: string,
    userId: string,
    dto: CreateBoardDto,
    ip: string,
  ) {
    const board = this.boardRepository.create({
      ...dto,
      room_id: roomId,
      created_by: userId,
    });

    const saved = await this.boardRepository.save(board);

    await this.auditService.record({
      user_id: userId,
      action: "CREATE",
      entity: "boards",
      entity_id: saved.id,
      new_values: { ...saved },
      ip,
    });

    return saved;
  }

  async getBoards(roomId: string, q: BoardQueryDto) {
    const qb = this.boardRepository
      .createQueryBuilder("board")
      .where("board.room_id = :roomId", { roomId })
      .orderBy("board.position", "ASC")
      .addOrderBy("board.created_at", "ASC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.search) {
      qb.andWhere("board.title ILIKE :search", {
        search: `%${q.search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, q);
  }

  async findBoardInRoom(roomId: string, boardId: string) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, room_id: roomId },
    });

    if (!board) {
      throw new NotFoundException("Board not found");
    }

    return board;
  }

  async getBoard(roomId: string, boardId: string) {
    const board = await this.findBoardInRoom(roomId, boardId);

    const elementCount = await this.elementRepository.count({
      where: { board_id: board.id },
    });

    return { ...board, element_count: elementCount };
  }

  async updateBoard(
    roomId: string,
    boardId: string,
    userId: string,
    dto: UpdateBoardDto,
    ip: string,
  ) {
    const board = await this.findBoardInRoom(roomId, boardId);
    const oldValues = { ...board };

    Object.assign(board, dto);

    const saved = await this.boardRepository.save(board);

    await this.auditService.record({
      user_id: userId,
      action: "UPDATE",
      entity: "boards",
      entity_id: saved.id,
      old_values: oldValues,
      new_values: { ...saved },
      ip,
    });

    return saved;
  }

  async deleteBoard(
    roomId: string,
    boardId: string,
    userId: string,
    ip: string,
  ) {
    const board = await this.findBoardInRoom(roomId, boardId);
    const id = board.id;
    const oldValues = { ...board };

    await this.boardRepository.remove(board);

    await this.auditService.record({
      user_id: userId,
      action: "DELETE",
      entity: "boards",
      entity_id: id,
      old_values: oldValues,
      ip,
    });

    return { message: "Board deleted successfully" };
  }

  // -------------------------
  // ELEMENTS
  // -------------------------

  async createElement(
    roomId: string,
    boardId: string,
    userId: string,
    dto: CreateElementDto,
    ip: string,
  ) {
    await this.findBoardInRoom(roomId, boardId);

    this.checkData(dto.type, dto.data);

    const element = this.elementRepository.create({
      board_id: boardId,
      created_by: userId,
      type: dto.type,
      data: dto.data,
      z_index: dto.z_index ?? 0,
      version: 1,
    });

    const saved = await this.elementRepository.save(element);

    await this.auditService.record({
      user_id: userId,
      action: "CREATE",
      entity: "board_elements",
      entity_id: saved.id,
      new_values: { ...saved },
      ip,
    });

    return saved;
  }

  async getElements(roomId: string, boardId: string, q: ElementQueryDto) {
    await this.findBoardInRoom(roomId, boardId);

    const qb = this.elementRepository
      .createQueryBuilder("element")
      .where("element.board_id = :boardId", { boardId })
      .orderBy("element.z_index", "ASC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.type) {
      qb.andWhere("element.type = :type", { type: q.type });
    }

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, q);
  }

  async getElement(roomId: string, boardId: string, elementId: string) {
    await this.findBoardInRoom(roomId, boardId);

    const element = await this.elementRepository.findOne({
      where: { id: elementId, board_id: boardId },
    });

    if (!element) {
      throw new NotFoundException("Element not found");
    }

    return element;
  }

  async updateElement(
    roomId: string,
    boardId: string,
    elementId: string,
    userId: string,
    dto: UpdateElementDto,
    ip: string,
  ) {
    const element = await this.getElement(roomId, boardId, elementId);
    const oldValues = { ...element };

    if (dto.data !== undefined) {
      this.checkData(element.type, dto.data);
    }

    const changes: any = {};

    if (dto.data !== undefined) {
      changes.data = dto.data;
    }

    if (dto.z_index !== undefined) {
      changes.z_index = dto.z_index;
    }

    const result = await this.elementRepository.update(
      { id: elementId, board_id: boardId, version: dto.version },
      { ...changes, version: () => "version + 1" },
    );

    if (result.affected === 0) {
      throw new ConflictException(
        "This element was changed by someone else. Load it again and retry.",
      );
    }

    const updated = await this.getElement(roomId, boardId, elementId);

    await this.auditService.record({
      user_id: userId,
      action: "UPDATE",
      entity: "board_elements",
      entity_id: updated.id,
      old_values: oldValues,
      new_values: { ...updated },
      ip,
    });

    return updated;
  }

  async deleteElement(
    roomId: string,
    boardId: string,
    elementId: string,
    userId: string,
    ip: string,
  ) {
    const element = await this.getElement(roomId, boardId, elementId);
    const id = element.id;
    const oldValues = { ...element };

    await this.elementRepository.remove(element);

    await this.auditService.record({
      user_id: userId,
      action: "DELETE",
      entity: "board_elements",
      entity_id: id,
      old_values: oldValues,
      ip,
    });

    return { message: "Element deleted successfully" };
  }
}