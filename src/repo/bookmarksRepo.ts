import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Bookmark, SyncStatus } from '../types';

// データ層インターフェース: UI 側は Dexie か Firestore かを意識しない。
// パスは users/{uid}/bookmarks/{bookmarkId}。

const FIRESTORE_BATCH_LIMIT = 500;

const bookmarksCol = (uid: string) =>
  collection(db as Firestore, 'users', uid, 'bookmarks');

// Firestore は undefined を受け付けないため、書き込み前に除去する。
const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
};

// リアルタイム購読。metadata から同期状態を導出してクラウドアイコンに反映する。
export const subscribeBookmarks = (
  uid: string,
  onChange: (bookmarks: Bookmark[], status: SyncStatus) => void,
  onError?: (err: Error) => void,
) => {
  return onSnapshot(
    bookmarksCol(uid),
    { includeMetadataChanges: true },
    (snap) => {
      const bookmarks: Bookmark[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Bookmark, 'id'>),
      }));
      const status: SyncStatus = snap.metadata.hasPendingWrites
        ? 'pending'
        : snap.metadata.fromCache
          ? 'offline'
          : 'synced';
      onChange(bookmarks, status);
    },
    (err) => onError?.(err),
  );
};

export const addBookmark = async (uid: string, data: Omit<Bookmark, 'id'>) => {
  const now = Math.floor(Date.now() / 1000);
  const ref = await addDoc(bookmarksCol(uid), stripUndefined({
    ...data,
    lastModified: now,
  }));
  return ref.id;
};

// 一括インポート。500件ごとにバッチ分割して書き込む。
export const bulkAddBookmarks = async (
  uid: string,
  items: Array<Omit<Bookmark, 'id'>>,
) => {
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < items.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db as Firestore);
    const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
    for (const item of chunk) {
      batch.set(doc(bookmarksCol(uid)), stripUndefined({
        ...item,
        lastModified: now,
      }));
    }
    await batch.commit();
  }
};

export const updateBookmark = async (
  uid: string,
  id: string,
  updates: Partial<Bookmark>,
) => {
  await updateDoc(doc(bookmarksCol(uid), id), stripUndefined({
    ...updates,
    lastModified: Math.floor(Date.now() / 1000),
  }));
};

// 並び替え用の一括更新
export const updateBookmarkPositions = async (
  uid: string,
  positions: Array<{ id: string; order: number }>,
) => {
  const batch = writeBatch(db as Firestore);
  for (const { id, order } of positions) {
    batch.update(doc(bookmarksCol(uid), id), { order });
  }
  await batch.commit();
};

export const removeBookmark = async (uid: string, id: string) => {
  await deleteDoc(doc(bookmarksCol(uid), id));
};

// 全削除。ドキュメントを集めて 500 件ごとにバッチ削除する。
export const clearAllBookmarks = async (uid: string) => {
  const snap = await getDocs(bookmarksCol(uid));
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db as Firestore);
    refs.slice(i, i + FIRESTORE_BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};
