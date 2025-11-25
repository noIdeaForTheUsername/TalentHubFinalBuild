import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Profile } from '../profile.interface';
import { ProfileService } from '../profile.service';
import { schoolClassRangeValidator, getClassBounds } from '../../shared/form-utils';
import { ReadableClassPipe } from '../../shared/readable-class-pipe/readable-class.pipe-pipe';
import { FormComponent } from '../../shared/form-component/form-component';
import { HeaderComponent } from '../../shared/header/header.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { PostCardComponent } from '../../posts/post-card/post-card.component';
import { PostService } from '../../posts/post.service';

@Component({
  // Note: project uses standalone components by default per project guidelines.
  selector: 'app-profile-details',
  templateUrl: './profile-details-page.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    ReadableClassPipe,
      FormComponent,
    HeaderComponent,
    RouterLink,
    LoadingComponent,
    PostCardComponent
],
  styleUrls: ['./profile-details-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDetailsPage {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected authService = inject(AuthService);
  public profileService = inject(ProfileService);
  protected postService = inject(PostService);

  // optional author display for projects linking
  public author = signal<Profile | null>(null as Profile | null);
  public profilePosts = this.postService.userPosts;

  own = computed(() => this.authService.userId() == this.profile()?.id);
  profile = signal<Profile | null>(null);

  // edit mode and form
  editMode = signal(false);
  form: FormGroup | null = null;
  passkeyAdding = signal(false);

  // skills view
  skillsList = computed(() => this.getSkillsList(this.profile()?.favoriteSubjects || ''));

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      const id = idStr && parseInt(idStr);

      if (!id) return; // TODO error page

      this.loadProfile(id);
    });
  }

  private loadProfile(profileIdInt: number) {
    this.profileService.getProfileById(profileIdInt).subscribe({
      next: p => this.profile.set(p),
      error: () => {}
    });

    this.postService.loadUserPosts(profileIdInt).subscribe({  // this will immediately re-set the userPosts if we view the same profile again
      next: () => {}  // Nothing needed here, the post service signal will update the list automatically
    });
  }



  private getSkillsList(strList: string) {
    if (!strList) return [];
    return strList.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private createFormFromProfile(p: Profile): FormGroup {
    const group = this.fb.group({
      schoolType: [p.schoolType, [Validators.required]],
      schoolClass: [p.schoolClass, [Validators.required]],
      city: [p.city, [Validators.required]],
      favoriteSubjects: [p.favoriteSubjects ?? ''],
      bio: [p.bio ?? ''],
    });

    // add validator to ensure schoolClass fits the bounds for given schoolType
    group.setValidators(schoolClassRangeValidator());

    // revalidate when schoolType changes
    group.get('schoolType')?.valueChanges.subscribe(() => {
      group.get('schoolClass')?.updateValueAndValidity();
      group.updateValueAndValidity();
    });

    return group;
  }



  protected logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  protected async addPasskey() {
    try {
      this.passkeyAdding.set(true);
      await this.authService.addPasskey();
      window.alert("Pomyślnie zarejestrowano klucz dostępu! Możesz go używać podczas następnych logowań z tego urządzenia");
    }
    catch (e) {
      console.log("passkey registration failed: ", e);
      window.alert("Nie udało się zarejestrować klucza dostępu");
    }
    finally {
      this.passkeyAdding.set(false);
    }
  }

  protected toggleEdit() {
    const editing = this.editMode();
    if (!editing) {
      // enter edit mode: build the form from current profile
      const p = this.profile();
      if (!p) return;
      this.form = this.createFormFromProfile(p);
      this.editMode.set(true);
      return;
    }

    // if saving
    if (this.form) {
      if (this.form.valid) {
        const val = this.form.value;
        const current = this.profile();
        if (!current) return;
        const dto: any = {};
        if (val.schoolType) dto.schoolType = val.schoolType;
        if (val.schoolClass != null) dto.schoolClass = Number(val.schoolClass);
        if (val.city) dto.city = val.city;
        if (val.favoriteSubjects != null) dto.favoriteSubjects = val.favoriteSubjects;
        if (val.bio != null) dto.bio = val.bio;

        this.profileService.updateProfile(current.id, dto).subscribe({
          next: (updated: Profile) => {
            this.profile.set(updated);
            this.editMode.set(false);
            this.form = null;
          }
        });
      } else {
        this.form.markAllAsTouched();
      }
    }
  }



  protected cancelEdit() {
    this.editMode.set(false);
    this.form = null;
  }

  // Open chat with this profile. If not logged in, navigate to login first.
  protected openChat() {
    const p = this.profile();
    if (!p) return;
    const me = this.authService.userId();
    if (!me) {
      // navigate to login and preserve redirect
      this.router.navigate(['/login'], { queryParams: { redirect: `/profiles/${p.id}/chat` } });
      return;
    }

    // navigate to profile chat route (chat page will create or fetch chat)
    this.router.navigate([`/profiles/${p.id}/chat`]);
  }
}