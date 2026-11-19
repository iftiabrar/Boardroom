import {
    Body,
    Controller,
    Delete,
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

@Controller()
export class LobbyController {
    constructor(private readonly lobbyService: LobbyService) { }

    @Post('rooms/:roomId/lobby')
    requestJoin(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateLobbyRequestDto,
    ) {
        return this.lobbyService.requestJoin(roomId, user.id, dto);
    }

    @Get('rooms/:roomId/lobby')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    listPendingRequests(@Param('roomId', ParseUUIDPipe) roomId: string) {
        return this.lobbyService.listPendingRequests(roomId);
    }

    @Get('rooms/:roomId/lobby/:requestId')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    getRequestById(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('requestId', ParseUUIDPipe) requestId: string,
    ) {
        return this.lobbyService.getRequestById(roomId, requestId);
    }

    @Get('lobby/mine')
    listMyRequests(@CurrentUser() user: any) {
        return this.lobbyService.listMyRequests(user.id);
    }

    @Delete('lobby/:requestId')
    cancelMyRequest(
        @Param('requestId', ParseUUIDPipe) requestId: string,
        @CurrentUser() user: any,
    ) {
        return this.lobbyService.cancelMyRequest(requestId, user.id);
    }

    @Post('rooms/:roomId/lobby/:reqId/approve')
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

    @Post('rooms/:roomId/lobby/:reqId/reject')
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