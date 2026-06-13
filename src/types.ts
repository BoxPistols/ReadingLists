export interface Bookmark {
  // Firestore のドキュメントID（文字列）。新規作成前は undefined。
  id?: string;
  title: string;
  url: string;
  addDate: number;
  lastModified?: number;
  icon?: string;
  // AI 自動分類による単一カテゴリ（src/constants/taxonomy.ts の CATEGORIES）。
  category?: string;
  tags?: string[];
  image?: string;
  order?: number; // 並び替え用の順序
  ogp?: {
    title?: string;
    description?: string;
    image?: string;
    loaded?: boolean;
  };
}

export type ViewMode = 'list' | 'grid' | 'table';

export type SortBy = 'date' | 'lastModified' | 'manual';

// 同期状態（クラウドアイコン表示用）
export type SyncStatus = 'synced' | 'pending' | 'offline';
