import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Post } from '../post.interface';
import { ReadableClassPipe } from '../../shared/readable-class-pipe/readable-class.pipe-pipe';
import { PeopleNumberPipe } from '../people-number.pipe';
import { DateFromToPipe } from '../date-from-to.pipe';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, DateFromToPipe, ReadableClassPipe, PeopleNumberPipe, RouterLink],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  post = input.required<Post>();
}
