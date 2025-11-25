import { Body, Controller, Get, Post, Param, Query, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatsService } from './chats.service';
import type { Chat, Message } from './chats.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { Request } from 'express';

class CreateChatDto {
  participant1!: number;
  participant2!: number;
}

class CreateMessageDto {
  senderId!: number;
  content!: string;
  timestamp!: string; // ISO string
}

@Controller('api/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService, private readonly profilesService: ProfilesService) {}

  private async getSessionUserId(req: Request): Promise<number> {
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new BadRequestException('no session');
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new BadRequestException('invalid session');
    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new BadRequestException('invalid session');
    }
    const user = await this.profilesService.findByLogin(login);
    if (!user) throw new BadRequestException('invalid session');
    return user.id;
  }

  @Post()
  async create(@Body() dto: CreateChatDto, @Req() req: Request): Promise<Chat> {
    // validate participants exist
    const p1 = await this.profilesService.findOne(dto.participant1);
    const p2 = await this.profilesService.findOne(dto.participant2);
    if (!p1 || !p2) throw new BadRequestException('participant not found');

    // authorization: caller must be one of participants
    const caller = await this.getSessionUserId(req);
    if (caller !== dto.participant1 && caller !== dto.participant2) throw new BadRequestException('not authorized to create chat for others');

    const chat = await this.chatsService.createChat(dto.participant1, dto.participant2);
    // when client fetches/creates a chat, mark existing messages as read for the caller
    try {
      this.chatsService.markRead(chat.id, caller);
    } catch (e) {
      // ignore errors
    }
    // If chat already existed it may have persisted messages — return full chat view
    const full = await this.chatsService.getChat(chat.id);
    if (full) return full;
    return { id: chat.id, participants: [chat.participantA, chat.participantB], messages: [] };
  }

  // list chats for the logged-in user with unread counts and last message metadata
  @Get('list')
  async list(@Req() req: Request) {
    const caller = await this.getSessionUserId(req);
    const list = await this.chatsService.getChatsForUser(caller);
    // enrich with other participant public profile
    return await Promise.all(
      list.map(async (m) => {
        const otherProfile = await this.profilesService.findOne(m.otherId);
        return {
          id: m.id,
          participants: m.participants,
          other: otherProfile || { id: m.otherId, login: String(m.otherId) },
          lastMessage: m.lastMessage,
          unreadCount: m.unreadCount,
        };
      }),
    );
  }


  @Post(':id/messages')
  async postMessage(@Param('id') id: string, @Body() dto: CreateMessageDto, @Req() req: Request) {
    const chatId = Number(id);
    if (Number.isNaN(chatId)) throw new BadRequestException('invalid id');
    const chat = await this.chatsService.getChat(chatId);
    if (!chat) throw new NotFoundException('chat not found');

    const caller = await this.getSessionUserId(req);
    // sender must match caller and must be participant
    if (dto.senderId !== caller) throw new BadRequestException('sender must be the logged-in user');
    if (!chat.participants.includes(dto.senderId)) throw new BadRequestException('sender is not a participant');

    // validate content
    if (!dto.content || typeof dto.content !== 'string' || dto.content.trim() === '') throw new BadRequestException('content is required');

    // timestamp validated in service; it will be normalized to ISO
    const msg = await this.chatsService.addMessage(chatId, dto.senderId, dto.content.trim(), dto.timestamp);
    return msg;
  }

  @Get(':id')
  async getChat(@Param('id') id: string, @Req() req: Request): Promise<Chat> {
    const chatId = Number(id);
    if (Number.isNaN(chatId)) throw new BadRequestException('invalid id');
    const chat = await this.chatsService.getChat(chatId);
    if (!chat) throw new NotFoundException('chat not found');

    const caller = await this.getSessionUserId(req);
    if (!chat.participants.includes(caller)) throw new BadRequestException('not authorized');

    return chat;
  }

  @Get(':id/messages')
  async listMessages(@Param('id') id: string, @Req() req: Request): Promise<Message[]> {
    const chatId = Number(id);
    if (Number.isNaN(chatId)) throw new BadRequestException('invalid id');
    const chat = await this.chatsService.getChat(chatId);
    if (!chat) throw new NotFoundException('chat not found');

    const caller = await this.getSessionUserId(req);
    if (!chat.participants.includes(caller)) throw new BadRequestException('not authorized');

    return await this.chatsService.getMessages(chatId);
  }
}
