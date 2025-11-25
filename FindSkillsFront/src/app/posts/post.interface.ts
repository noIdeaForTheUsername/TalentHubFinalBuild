export interface Post {
  type: 'project' | 'competition';
  id: number,
  authorId: number,
  
  name: string,
  remote: boolean,
  subject: string,
  description: string,

  schoolType: 'primary' | 'secondary' | 'university',
  schoolClass?: number,
  link?: string,
  city?: string,
  beginDate?: Date,
  endDate?: Date,
  minPeople?: number,
  maxPeople?: number,
  currentPeople?: number,
}

export interface PostComment {
  id: number;
  projectId: number;
  authorId: number;
  authorLogin?: string;
  content: string;
  timestamp: string;
  parentId?: number;
}
