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
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
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
    @Get('invites/:token')
    getInvitePreview(@Param('token') token: string) {
        return this.invitesService.getInvitePreview(token);
    }

    @Post('invites/:token/accept')
    acceptInvite(@Param('token') token: string, @CurrentUser() user: any) {
        return this.invitesService.acceptInvite(token, user.id);
    }
}