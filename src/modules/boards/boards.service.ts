import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Board } from "./entities/board.entity";
import { BoardElement } from "./entities/board-element.entity";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto } from "./dto/board-query.dto";
import { CreateElementDto } from "./dto/create-element.dto";
import { UpdateElementDto } from "./dto/update-element.dto";
import { ElementQueryDto } from "./dto/element-query.dto";
import { paginate } from "../../common/helpers/paginate";

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(BoardElement)
    private readonly elementRepository: Repository<BoardElement>,
  ) {}

  async createBoard(
    roomId: string,
    userId: string,
    dto: CreateBoardDto,
  ) {
    const board = this.boardRepository.create({
      ...dto,
      room_id: roomId,
      created_by: userId,
    });

    return this.boardRepository.save(board);
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
      where: {
        id: boardId,
        room_id: roomId,
      },
    });

    if (!board) {
      throw new NotFoundException("Board not found");
    }

    return board;
  }

  async getBoard(roomId: string, boardId: string) {
    const board = await this.findBoardInRoom(roomId, boardId);

    const elementCount = await this.elementRepository.count({
      where: {
        board_id: board.id,
      },
    });

    return {
      ...board,
      element_count: elementCount,
    };
  }

  async updateBoard(
    roomId: string,
    boardId: string,
    dto: UpdateBoardDto,
  ) {
    const board = await this.findBoardInRoom(roomId, boardId);

    Object.assign(board, dto);

    return this.boardRepository.save(board);
  }

  async deleteBoard(roomId: string, boardId: string) {
    const board = await this.findBoardInRoom(roomId, boardId);

    await this.boardRepository.remove(board);

    return {
      message: "Board deleted successfully",
    };
  }

  // -------------------------
  // ELEMENTS
  // -------------------------

  async createElement(
    roomId: string,
    boardId: string,
    userId: string,
    dto: CreateElementDto,
  ) {
    await this.findBoardInRoom(roomId, boardId);

    const element = this.elementRepository.create({
      board_id: boardId,
      created_by: userId,
      type: dto.type,
      data: dto.data,
      z_index: dto.z_index ?? 0,
      version: 1,
    });

    return this.elementRepository.save(element);
  }

  async getElements(
    roomId: string,
    boardId: string,
    q: ElementQueryDto,
  ) {
    await this.findBoardInRoom(roomId, boardId);

    const qb = this.elementRepository
      .createQueryBuilder("element")
      .where("element.board_id = :boardId", { boardId })
      .orderBy("element.z_index", "ASC")
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.type) {
      qb.andWhere("element.type = :type", {
        type: q.type,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, q);
  }

  async getElement(
    roomId: string,
    boardId: string,
    elementId: string,
  ) {
    await this.findBoardInRoom(roomId, boardId);

    const element = await this.elementRepository.findOne({
      where: {
        id: elementId,
        board_id: boardId,
      },
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
    dto: UpdateElementDto,
  ) {
    const element = await this.getElement(
      roomId,
      boardId,
      elementId,
    );

    const changes: any = {};

    if (dto.data !== undefined) {
      changes.data = dto.data;
    }

    if (dto.z_index !== undefined) {
      changes.z_index = dto.z_index;
    }

    const result = await this.elementRepository.update(
      {
        id: elementId,
        board_id: boardId,
        version: dto.version,
      },
      {
        ...changes,
        version: () => "version + 1",
      },
    );

    if (result.affected === 0) {
      throw new ConflictException(
        "This element was changed by someone else. Load it again and retry.",
      );
    }

    return this.getElement(roomId, boardId, elementId);
  }

  async deleteElement(
    roomId: string,
    boardId: string,
    elementId: string,
  ) {
    const element = await this.getElement(
      roomId,
      boardId,
      elementId,
    );

    await this.elementRepository.remove(element);

    return {
      message: "Element deleted successfully",
    };
  }
}