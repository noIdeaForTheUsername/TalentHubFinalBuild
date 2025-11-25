import { output, Pipe, PipeTransform } from '@angular/core';
import { Post } from './post.interface';

@Pipe({
  name: 'peopleNumber'
})
export class PeopleNumberPipe implements PipeTransform {

  transform(value: Post): string {
    let array = [];

    if (value.currentPeople) array.push("obecnie " + value.currentPeople);
    if (value.minPeople) array.push("minimalnie " + value.minPeople);
    if (value.maxPeople) array.push("maksymalnie " + value.maxPeople);

    if (array.length === 0) return "nie ustawiono";

    return array.join(', ');
  }
}
