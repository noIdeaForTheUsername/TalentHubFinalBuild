import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatEntity } from '../entities/chat.entity';
import { MessageEntity } from '../entities/message.entity';

export interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string; // ISO string
}

export interface Chat {
  id: number;
  participants: [number, number];
  messages: Message[];
}

@Injectable()
export class ChatsService {
  // lastSeen remains in-memory for now
  private lastSeen: Map<number, Map<number, number>> = new Map();

  constructor(
    @InjectRepository(ChatEntity) private chatsRepo: Repository<ChatEntity>,
    @InjectRepository(MessageEntity) private messagesRepo: Repository<MessageEntity>,
  ) {}

  private normalizePair(a: number, b: number): [number, number] {
    return a <= b ? [a, b] : [b, a];
  }

  async findChatByParticipants(a: number, b: number): Promise<ChatEntity | undefined> {
    const [x, y] = this.normalizePair(a, b);
    const found = await this.chatsRepo.findOne({ where: { participantA: x, participantB: y } });
    return found ?? undefined;
  }

  async createChat(a: number, b: number): Promise<ChatEntity> {
    const [x, y] = this.normalizePair(a, b);
    const existing = await this.findChatByParticipants(x, y);
    if (existing) return existing;
    const chat = this.chatsRepo.create();
    chat.participantA = x;
    chat.participantB = y;
    const saved = await this.chatsRepo.save(chat);
    this.lastSeen.set(saved.id, new Map([[x, 0], [y, 0]]));
    return saved;
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const chat = await this.chatsRepo.findOne({ where: { id } });
    if (!chat) return undefined;
    const messages = await this.messagesRepo.find({ where: { chatId: id } });
    const mapped = messages.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, timestamp: m.timestamp.toISOString() }));
    return { id: chat.id, participants: [chat.participantA, chat.participantB], messages: mapped };
  }

  async addMessage(chatId: number, senderId: number, content: string, timestampIso: string): Promise<Message> {
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');
    if (![chat.participantA, chat.participantB].includes(senderId)) throw new BadRequestException('Sender is not a participant of the chat');

    const parsed = Date.parse(timestampIso);
    if (Number.isNaN(parsed)) throw new BadRequestException('timestamp must be a valid ISO string');
    const isoDate = new Date(parsed);

    const m = this.messagesRepo.create();
    m.chatId = chatId;
    m.senderId = senderId;
    m.content = content;
    m.timestamp = isoDate;
    const saved = await this.messagesRepo.save(m);
    // update lastSeen for sender
    const seenMap = this.lastSeen.get(chatId) ?? new Map<number, number>();
    seenMap.set(senderId, saved.id);
    this.lastSeen.set(chatId, seenMap);
    return { id: saved.id, senderId: saved.senderId, content: saved.content, timestamp: saved.timestamp.toISOString() };
  }

  markRead(chatId: number, userId: number) {
    // find last message id
    // this is not persisted; kept simple for now
    this.messagesRepo
      .find({ where: { chatId }, order: { id: 'ASC' } })
      .then((msgs) => {
        const last = msgs.length ? msgs[msgs.length - 1].id : 0;
        const seenMap = this.lastSeen.get(chatId) ?? new Map<number, number>();
        seenMap.set(userId, last);
        this.lastSeen.set(chatId, seenMap);
      });
  }

  async getChatsForUser(userId: number): Promise<Array<{ id: number; participants: [number, number]; otherId: number; lastMessage?: Message; unreadCount: number }>> {
    const chats = await this.chatsRepo.find();
    const out: Array<{ id: number; participants: [number, number]; otherId: number; lastMessage?: Message; unreadCount: number }> = [];
    for (const c of chats) {
      if (![c.participantA, c.participantB].includes(userId)) continue;
      const messages = await this.messagesRepo.find({ where: { chatId: c.id }, order: { id: 'ASC' } });
      if (!messages || messages.length === 0) continue;
      const other = c.participantA === userId ? c.participantB : c.participantA;
      const lastMsgRow = messages[messages.length - 1];
      const lastMsg: Message = { id: lastMsgRow.id, senderId: lastMsgRow.senderId, content: lastMsgRow.content, timestamp: lastMsgRow.timestamp.toISOString() };
      const seenMap = this.lastSeen.get(c.id) ?? new Map<number, number>();
      const seenId = seenMap.get(userId) ?? 0;
      const unread = messages.filter((m) => m.id > seenId && m.senderId !== userId).length;
      out.push({ id: c.id, participants: [c.participantA, c.participantB], otherId: other, lastMessage: lastMsg, unreadCount: unread });
    }
    out.sort((a, b) => {
      const ta = a.lastMessage ? Date.parse(a.lastMessage.timestamp) : 0;
      const tb = b.lastMessage ? Date.parse(b.lastMessage.timestamp) : 0;
      return tb - ta;
    });
    return out;
  }

  async getMessages(chatId: number) {
    const messages = await this.messagesRepo.find({ where: { chatId }, order: { id: 'ASC' } });
    return messages.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, timestamp: m.timestamp.toISOString() }));
  }
}
