import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendWelcome(to: string, name: string) {
        console.log(`[Mail Stub] Welcome email to ${to} (${name})`);
    }

    async sendInvite(
        to: string,
        roomName: string,
        inviterName: string,
        link: string,
    ) {
        console.log(
            `[Mail Stub] Invite email to ${to} for room ${roomName} by ${inviterName}: ${link}`,
        );
    }

    async sendLobbyDecision(to: string, roomName: string, approved: boolean) {
        console.log(
            `[Mail Stub] Lobby decision to ${to} for room ${roomName}: approved=${approved}`,
        );
    }
}