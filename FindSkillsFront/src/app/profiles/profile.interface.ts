export interface Profile {
  id: number;
  login: string;
  schoolType: 'primary' | 'secondary' | 'university';
  schoolClass: number;
  city: string;
  favoriteSubjects?: string;
  bio?: string;
}