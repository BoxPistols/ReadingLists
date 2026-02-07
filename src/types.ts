export interface Bookmark {
  id?: number;
  title: string;
  url: string;
  addDate: number;
  lastModified?: number;
  icon?: string;
  tags?: string[];
  image?: string;
  ogp?: {
    title?: string;
    description?: string;
    image?: string;
    loaded?: boolean;
  };
}

export type ViewMode = 'list' | 'grid';
