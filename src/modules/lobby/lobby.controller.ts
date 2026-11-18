import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { CreateLobbyRequestDto } from './dto/create-lobby-request.dto';
import { ApproveLobbyRequestDto } from './dto/decide-lobby-request.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RoomRoles } from '@/common/decorators/room-roles.decorator';
import { RoomRolesGuard } from '@/common/guard/room-roles.guard';
import { RoomRole } from '@/common/enums/room-role.enum';

@Controller('rooms/:roomId/lobby')
export class LobbyController {
    constructor(private readonly lobbyService: LobbyService) { }

    @Post()
    requestJoin(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateLobbyRequestDto,
    ) {
        return this.lobbyService.requestJoin(roomId, user.id, dto);
    }

    @Get()
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    listPendingRequests(@Param('roomId', ParseUUIDPipe) roomId: string) {
        return this.lobbyService.listPendingRequests(roomId);
    }

    @Post(':reqId/approve')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    approveRequest(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('reqId', ParseUUIDPipe) reqId: string,
        @CurrentUser() user: any,
        @Body() dto: ApproveLobbyRequestDto,
    ) {
        return this.lobbyService.approveRequest(roomId, reqId, user.id, dto);
    }

    @Post(':reqId/reject')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    rejectRequest(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('reqId', ParseUUIDPipe) reqId: string,
        @CurrentUser() user: any,
    ) {
        return this.lobbyService.rejectRequest(roomId, reqId, user.id);
    }
}