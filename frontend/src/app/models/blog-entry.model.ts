import { User } from './user.model';
import { Comment } from './comment.model';

export interface ContentBlock {
  type: 'text' | 'link' | 'image';
  data: string | Record<string, unknown>;
}

export interface BlogEntry {
  _id?: string;
  title: string;
  author: Partial<User> & { _id: string; username: string };
  description?: string;
  creationDate?: Date;
  editDates?: Date[];
  impressionCount?: number;
  categories?: string[];
  content?: ContentBlock[];
  commentsAllowed?: boolean;
  comments?: Comment[];
}
