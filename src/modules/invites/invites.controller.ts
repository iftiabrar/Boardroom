import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RoomRoles } from '@/common/decorators/room-roles.decorator';
import { RoomRolesGuard } from '@/common/guard/room-roles.guard';
import { RoomRole } from '@/common/enums/room-role.enum';

@Controller()
export class InvitesController {
    constructor(private readonly invitesService: InvitesService) { }

    @Post('rooms/:roomId/invites')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    createInvite(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateInviteDto,
    ) {
        return this.invitesService.createInvite(roomId, user.id, dto);
    }

    @Get('rooms/:roomId/invites')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    listRoomInvites(@Param('roomId', ParseUUIDPipe) roomId: string) {
        return this.invitesService.listRoomInvites(roomId);
    }

    @Get('rooms/:roomId/invites/:inviteId')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    getInviteById(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('inviteId', ParseUUIDPipe) inviteId: string,
    ) {
        return this.invitesService.getInviteById(roomId, inviteId);
    }

    @Patch('rooms/:roomId/invites/:inviteId')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    updateInvite(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('inviteId', ParseUUIDPipe) inviteId: string,
        @Body() dto: UpdateInviteDto,
    ) {
        return this.invitesService.updateInvite(roomId, inviteId, dto);
    }

    @Delete('rooms/:roomId/invites/:id')
    @UseGuards(RoomRolesGuard)
    @RoomRoles(RoomRole.OWNER)
    revokeInvite(
        @Param('roomId', ParseUUIDPipe) roomId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.invitesService.revokeInvite(roomId, id);
    }

    @Public()
    @Get('invites/:code')
    getInvitePreview(@Param('code') code: string) {
        return this.invitesService.getInvitePreview(code);
    }

    @Post('invites/:code/join')
    joinByInvite(
        @Param('code') code: string,
        @CurrentUser() user: any,
        @Body('message') message?: string,
    ) {
        return this.invitesService.joinByInvite(code, user.id, message);
    }
}