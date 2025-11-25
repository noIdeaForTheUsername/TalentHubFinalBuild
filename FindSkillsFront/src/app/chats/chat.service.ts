import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Chat, ChatMessage, ChatListItem } from './chat.interface';
import { AuthService } from '../accounts/auth-service/auth.service';
import { ConfigService } from '../config/config.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  private getOrCreateChatBetween(a: number, b: number): Observable<Chat | null> {
    return this.http.post<Chat>(`${this.configService.config.api_url}/api/chats`,
      { participant1: a, participant2: b }, { withCredentials: true })
      .pipe(
        catchError(() => of(null))
      );
  }

  getChat(participant: number): Observable<Chat | null> {
    return this.getOrCreateChatBetween(this.authService.userId()!, participant);
  }

  sendMessage(chatId: number, msg: ChatMessage) {
    return this.http.post<ChatMessage>(`${this.configService.config.api_url}/api/chats/${chatId}/messages`, msg, { withCredentials: true })
      .pipe(catchError(err => throwError(() => err)));
  }

  getChatList() {
    return this.http.get<ChatListItem[]>(`${this.configService.config.api_url}/api/chats/list`, { withCredentials: true });
  }
}
