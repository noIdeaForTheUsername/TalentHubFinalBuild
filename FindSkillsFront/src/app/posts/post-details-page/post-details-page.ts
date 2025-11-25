import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Post } from '../post.interface';
import { Profile } from '../../profiles/profile.interface';
import { ProfileService } from '../../profiles/profile.service';
import { PostService } from '../post.service';
import { ReadableClassPipe } from '../../shared/readable-class-pipe/readable-class.pipe-pipe';
import { DateFromToPipe } from '../date-from-to.pipe';
import { PeopleNumberPipe } from '../people-number.pipe';
import { HeaderComponent } from '../../shared/header/header.component';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
// form-component not required here (using PostFormComponent instead)
import { PostFormComponent } from '../post-form/post-form';
import { PostCommentSectionComponent } from '../post-comment-section/post-comment-section.component';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details-page.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ReadableClassPipe,
    DateFromToPipe,
    PeopleNumberPipe,
    HeaderComponent,
    PostFormComponent,
    LoadingComponent,
    RouterLink,
    PostCommentSectionComponent
  ],  
  styleUrls: ['./post-details-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailsPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public postService = inject(PostService);
  public profileService = inject(ProfileService);
  public author = signal<Profile | null>(null as Profile | null);

  post = signal<Post | null>(null);
  typeTitle = computed(() => this.post()?.type == "project" ? "Projekt" : "Konkurs");
  editMode = signal(false);
  form: FormGroup | null = null;
  own = computed(() => this.authService.userId() === this.post()?.authorId);

  ngOnInit() {
    const postIdStr = this.route.snapshot.paramMap.get('id');
    const postIdInt = postIdStr && parseInt(postIdStr);
    if (!postIdStr || !postIdInt) {
      return;
    }

    this.postService.getPostById(postIdInt).subscribe({
      next: (p: Post) => {
        if (p) {
          this.post.set(p);
          // fetch author login for display
          if (p.authorId) {
            this.profileService.getProfileById(p.authorId).subscribe({
              next: (prof: Profile) => {
                if (prof) this.author.set(prof);
              },
              error: () => {}
            });
      }}}
    });
  }

  enterEdit() {
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  submitEdit(dto: Partial<Post>) {
    const current = this.post();
    if (!current) return;
    this.postService.updatePost(current.id, dto).subscribe({
      next: (updated: Post) => {
        this.post.set(updated);
        this.editMode.set(false);
      }
    });
  }

  removePost() {
    const p = this.post();
    if (!p) return;
    if (!confirm('Czy na pewno chcesz usunąć ten post?')) return;
    const typeRoute = p.type === 'competition' ? 'competitions' : 'projects';
    this.postService.deletePost(p.id).subscribe({
      next: () => {
        // navigate back to posts listing
        this.router.navigate(['/posts', typeRoute]);
      }
    });
  }

  getPostType(): string {
    const p = this.post();
    return p?.type === 'competition' ? 'Konkurs:' : 'Post:';
  }

  getRemoteType(): string {
    const p = this.post();
    return p?.remote ? 'Zdalny' : 'Stacjonarny';
  }

  private cityRequiredIfNotRemote(control: AbstractControl) {
    const parent = control.parent as any;
    if (!parent) return null;
    const remote = parent.get('remote')?.value;
    const val = control.value;
    if (!remote && (!val || (typeof val === 'string' && val.trim() === ''))) {
      return { required: true };
    }
    return null;
  }
}
