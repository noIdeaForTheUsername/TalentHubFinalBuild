import { Component, ChangeDetectionStrategy, inject, signal, effect, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatService } from '../chat.service';
import { ChatMessage } from '../chat.interface';
import { ProfileService } from '../../profiles/profile.service';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { ChatMessageComponent } from '../chat-message/chat-message';
import { ChatInputComponent } from '../chat-input/chat-input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../shared/header/header.component';
import { LoadingComponent } from '../../shared/loading/loading.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatButtonModule, ChatMessageComponent,
    ChatInputComponent, HeaderComponent, RouterLink, LoadingComponent],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements AfterViewInit {
  // services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatService = inject(ChatService);
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);

  // scroll correction
  scrollElement: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('scroll', { static: false }) 
  set scrollSetter(el: ElementRef<HTMLDivElement> | undefined) { this.scrollElement = el; this.scrollToBottom(); }

  // variables
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected globalError = computed(() => { return this.auth.error() || this.error() });
  protected messages = signal<ChatMessage[]>([]);
  protected chatId = signal<number | null>(null);
  protected otherProfile = signal<any | null>(null);

  protected myId = this.auth.userId.asReadonly();
  protected notLoggedInConfirmed = this.auth.notLoggedInConfirmed.asReadonly();

  constructor() {
    effect(() => {
      // scroll to bottom when messages change
      const messages = this.messages();
      if (messages) {
        this.scrollToBottom();
      }
    });

    effect(() => {
      // load other user profile when myId is available
      const myId = this.myId();

      if (myId) {
        const idStr = this.route.snapshot.paramMap.get('id');
        this.loadChat(myId, idStr ? (Number(idStr) || 0) : 0);
      }
    });

    effect(() => {
      // display "not logged in" error if not logged in
      const notLoggedInConfirmed = this.notLoggedInConfirmed();

      if (notLoggedInConfirmed) {
        this.error.set("Nie jesteś zalogowany. To wymagane, aby korzystać z czatu.");
      }
    })
  }

  async ngOnInit() {
    this.loading.set(true);
    const otherIdStr = this.route.snapshot.paramMap.get('id');
    const otherId = otherIdStr ? Number(otherIdStr) : null;
    if (!otherId) {
      this.error.set('Nieprawidłowy użytkownik');
      this.loading.set(false);
      return;
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private async loadChat(myId: number, otherId: number) {
    // load other user's profile for header
    if (myId == otherId) this.router.navigate(["/my-chats"]);
    this.profileService.getProfileById(otherId).subscribe({
      next: p => this.otherProfile.set(p),
      error: () => {}
    });

    // get chat
    const chat = await lastValueFrom(this.chatService.getChat(otherId));
    if (!chat) {
      this.error.set("Nie znaleziono czatu lub nie masz do niego dostępu");
      this.loading.set(false);
      return;
    }

    this.chatId.set(chat.id);
    this.messages.set(chat.messages || []);
    this.loading.set(false);
  }

  // private async loadMessages(chatId: number) {
  //   const msgs = await lastValueFrom(this.chatService.getMessages(chatId));
  //   this.messages.set(msgs || []);
  // }

  private scrollToBottom() {
    if (this.scrollElement !== undefined) {
      requestAnimationFrame(() => {
        this.scrollElement!.nativeElement.scrollTop = this.scrollElement!.nativeElement.scrollHeight;
      });
    }}

  async onSend(text: string) {
    if (!this.chatId() || !this.myId()) return;
    const msg: ChatMessage = { senderId: this.myId()!, content: text, timestamp: new Date().toISOString() };
    await lastValueFrom(this.chatService.sendMessage(this.chatId()!, msg));

    // reload messages
    this.messages.update(msgs => [...msgs, msg]);
  }
}
