import { Pipe, PipeTransform } from '@angular/core';
import { Post } from './post.interface';

@Pipe({
  name: 'dateFromTo'
})
export class DateFromToPipe implements PipeTransform {
  transform(post: Post): string {
    let output = "";

    if (post.beginDate) output += "od " + post.beginDate.toLocaleDateString() + " ";
    if (post.endDate) output += "do " + post.endDate.toLocaleDateString();

    if (output === "") return "nie ustawiono";

    return output;
  }
}
