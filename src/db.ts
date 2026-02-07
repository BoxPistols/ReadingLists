import Dexie, { type EntityTable } from 'dexie';
import type { Bookmark } from './types';

// OGP情報もDBに保存するために型定義を拡張
// idはIndexedDBでの管理用（自動採番またはURLをキーにする）
export interface BookmarkEntity extends Bookmark {
  id?: number; 
}

const db = new Dexie('ReadingListDB') as Dexie & {
  bookmarks: EntityTable<
    BookmarkEntity,
    'id' // primary key "id" (for the typings only)
  >;
};

// スキーマ定義
// title, url, addDate, tags など検索やソートに使うフィールドにインデックスを貼る
db.version(1).stores({
  bookmarks: '++id, url, title, addDate, *tags' 
});

export { db };
