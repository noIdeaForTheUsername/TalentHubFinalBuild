import { Component, ChangeDetectionStrategy, inject, signal, input, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../post.service';
import { PostComment } from '../post.interface';
import { ChatMessageComponent } from '../../chats/chat-message/chat-message';
import { ChatInputComponent } from '../../chats/chat-input/chat-input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { LoadingComponent } from "../../shared/loading/loading.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-post-comment-section',
  imports: [CommonModule, ChatMessageComponent, ChatInputComponent, MatProgressSpinnerModule, LoadingComponent, RouterLink],
  templateUrl: './post-comment-section.component.html',
  styleUrl: './post-comment-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentSectionComponent {
  private postService = inject(PostService);
  protected authService = inject(AuthService);

  // Input: post ID
  postId = input.required<number>();
  postOwnerId = input.required<number>();

  // State
  protected comments = signal<PostComment[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected myId = this.authService.userId.asReadonly();

  // Scroll reference
  @ViewChild('commentsContainer', { static: false }) commentsContainer?: ElementRef<HTMLDivElement>;

  constructor() {
    // Load comments when postId changes
    effect(() => {
      const id = this.postId();
      if (id) {
        this.loadComments(id);
      }
    });
  }

  private loadComments(postId: number) {
    this.loading.set(true);
    this.error.set(null);
    
    this.postService.getComments(postId).subscribe({
      next: (comments: any) => {
        // Sort comments by timestamp descending (newest first)
        const sorted = (comments || []).sort((a: PostComment, b: PostComment) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.comments.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Problem z serwerem. Spróbuj później.');
        this.loading.set(false);
      }
    });
  }

  onSend(content: string) {
    const postId = this.postId();
    if (!postId || !content.trim()) return;

    this.postService.postComment(postId, content.trim()).subscribe({
      next: (newComment: any) => {
        // Add new comment to the beginning of the list (newest first)
        if (newComment && !newComment.error) {
          this.comments.set([newComment, ...this.comments()]);
          // Scroll to top after adding comment
          setTimeout(() => this.scrollToTop(), 100);
        }
      },
      error: () => {
        this.error.set('Problem z serwerem. Spróbuj później.');
      }
    });
  }

  private scrollToTop() {
    if (this.commentsContainer?.nativeElement) {
      this.commentsContainer.nativeElement.scrollTop = 0;
    }
  }
}
