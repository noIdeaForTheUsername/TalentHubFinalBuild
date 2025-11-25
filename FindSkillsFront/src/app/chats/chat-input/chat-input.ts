import { Component, Output, EventEmitter, ChangeDetectionStrategy, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './chat-input.html',
  styleUrls: ['./chat-input.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  text = '';
  sending = false;

  placeholder = input<string>('Napisz wiadomość...');
  send = output<string>();

  onSend() {
    const t = this.text?.trim();
    if (!t) return;
    this.text = '';
    this.sending = true;
    this.send.emit(t);
    // keep UI responsive; parent will clear text via template binding
  }

  onKeydown(e: KeyboardEvent) {
    // If Enter pressed without Shift => send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.onSend();
    }
    // Shift+Enter: allow newline (do nothing)
  }
}
