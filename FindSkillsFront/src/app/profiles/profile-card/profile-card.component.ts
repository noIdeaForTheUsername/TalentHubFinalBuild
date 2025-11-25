import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Profile } from '../profile.interface';
import { ReadableClassPipe } from '../../shared/readable-class-pipe/readable-class.pipe-pipe';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, ReadableClassPipe, RouterLink],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  profile = input.required<Profile>();
}
