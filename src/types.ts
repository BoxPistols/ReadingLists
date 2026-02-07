export interface Bookmark {
  title: string;
  url: string;
  addDate: number;
  lastModified?: number;
  icon?: string;
  tags?: string[];
  image?: string;
}

export type ViewMode = 'list' | 'grid';
