import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../chat.service';
import { ChatListItem } from '../chat.interface';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { lastValueFrom } from 'rxjs';
import { LoadingComponent } from '../../shared/loading/loading.component';

@Component({
  selector: 'app-chat-list-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatButtonModule, MatBadgeModule,
    HeaderComponent, RouterLink, LoadingComponent],
  templateUrl: './chat-list-page.html',
  styleUrls: ['./chat-list-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListPage {
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  chats = signal<ChatListItem[]>([]);

  meId = this.auth.userId();

  async ngOnInit() {
    if (!this.meId) {
      this.router.navigate(['/login']);
      return;
    }
    
    await this.loadChats();
  }

  async loadChats() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const list = await lastValueFrom(this.chatService.getChatList());
      this.chats.set(list || []);
    } catch (e) {
      this.error.set('Problem z serwerem. Spróbuj później');
    } finally {
      this.loading.set(false);
    }
  }

  openChat(chat: ChatListItem) {
    this.router.navigate(['/profiles', chat.other.id, 'chat']);
  }
}
