import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { appConfig } from '@/config/app.config';
import {
    welcomeTemplate,
    inviteTemplate,
    lobbyDecisionTemplate,
} from './templates/mail.templates';

@Injectable()
export class MailService {
    private transporter = nodemailer.createTransport({
        host: appConfig.env.MAILER_HOST,
        port: Number(appConfig.env.MAILER_PORT),
        secure: Boolean(appConfig.env.MAILER_SECURE),
        auth: {
            user: appConfig.env.MAILER_USER,
            pass: appConfig.env.MAILER_PASSWORD,
        },
    });

    private async send(to: string, mail: { subject: string; html: string }) {
        try {
            await this.transporter.sendMail({
                from: appConfig.env.MAILER_FROM,
                to,
                ...mail,
            });
        } catch (e) {
            console.error('[Mail] could not send to ' + to, e);
        }
    }

    sendWelcome(to: string, name: string) {
        return this.send(to, welcomeTemplate(name));
    }

    sendInvite(to: string, roomName: string, inviterName: string, link: string) {
        return this.send(to, inviteTemplate(roomName, inviterName, link));
    }

    sendLobbyDecision(to: string, roomName: string, approved: boolean) {
        return this.send(to, lobbyDecisionTemplate(roomName, approved));
    }
}