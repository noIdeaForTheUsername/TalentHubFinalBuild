import { Component, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ChatService } from './chats/chat.service';
import { AuthService } from './accounts/auth-service/auth.service';
import { filter } from 'rxjs/internal/operators/filter';
import { ProfileService } from './profiles/profile.service';
import { PostService } from './posts/post.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSlideToggleModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  // protected readonly title = signal('FindSkillsFront');
  private router = inject(Router);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private postService = inject(PostService);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.authService.resetErrors();
        this.profileService.resetErrors();
        this.postService.resetErrors();
      });
  }
}
