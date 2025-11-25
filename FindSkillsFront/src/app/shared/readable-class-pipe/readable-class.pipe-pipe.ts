import { Pipe, PipeTransform } from '@angular/core';

interface HasSchoolInfo {
  schoolClass?: number;
  schoolType: string;
}

@Pipe({
  name: 'readableClass',
  pure: true
})
export class ReadableClassPipe implements PipeTransform {

  transform(obj: HasSchoolInfo, handleUndefined: boolean = false): string {
    if (typeof obj === 'object' && obj !== null && 'schoolType' in obj) {
      if ('schoolClass' in obj) {
        const { schoolClass, schoolType: type } = obj as HasSchoolInfo;
        if (!schoolClass || !type) return '';
        
        return `Rok ${schoolClass}. ${this.getSchoolTypeName(obj.schoolType!)}`;
      }
      else {
        if (obj.schoolType == "primary") return "Szkoła podstawowa";
        else if (obj.schoolType == "secondary") return "Szkoła średnia";
        else return "Szkoła wyższa";
      }
    }

    if (handleUndefined) return 'Brak danych';
    else return '';
  }

  private getSchoolTypeName(schoolType: string): string {
    let name = "szkoły podstawowej";
    switch (schoolType) {
      case 'secondary': name = 'szkoły średniej'; break;
      case 'university': name = 'uczelni wyższej'; break;
    }
    return name;
  }

}
