import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PostService } from '../post.service';
import { PostFormComponent } from '../post-form/post-form';
import { HeaderComponent } from '../../shared/header/header.component';
import { LoadingComponent } from "../../shared/loading/loading.component";

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, HeaderComponent, PostFormComponent, LoadingComponent],
  templateUrl: './post-create-page.html',
  styleUrls: ['./post-create-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCreatePage {
  protected postService = inject(PostService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected submitting = signal(false);
  protected defaultType = signal<'project' | 'competition'>('project');

  constructor() {
    effect(() => {
      const type = this.route.snapshot.paramMap.get('type');
      if (type === 'competitions') {
        this.defaultType.set('competition');
      } else {
        this.defaultType.set('project');
      }
    });
  }

  create(dto: any) {
    this.submitting.set(true);
    this.postService.createPost(dto).subscribe({
      next: (created) => {
        const id = (created && (created as any).id) || null;
        const type = this.defaultType();
        const typeRoute = type === 'competition' ? 'competitions' : 'projects';
        if (id) this.router.navigate(['/posts', typeRoute, id]);
        else this.router.navigate(['/posts', typeRoute]);
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
      }
    });
  }
}
