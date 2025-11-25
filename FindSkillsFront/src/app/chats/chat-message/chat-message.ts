import { Component, Input, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../chat.interface';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.html',
  styleUrls: ['./chat-message.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  message = input.required<ChatMessage>();
  displayLogin = input(false);
  myId = input.required<number>();
}
