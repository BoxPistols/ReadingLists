import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { db } from '../firebase';

const settingsDoc = (uid: string) => doc(db as Firestore, 'users', uid, 'settings', 'general');

export const getCustomCategories = async (uid: string): Promise<string[] | null> => {
  const snap = await getDoc(settingsDoc(uid));
  if (snap.exists()) {
    return snap.data().categories as string[];
  }
  return null;
};

export const saveCustomCategories = async (uid: string, categories: string[]) => {
  await setDoc(settingsDoc(uid), { categories }, { merge: true });
};

// カテゴリ名の変更（全ブックマークを一括更新）
export const renameCategoryAcrossBookmarks = async (
  uid: string,
  oldName: string,
  newName: string,
) => {
  const bookmarksCol = collection(db as Firestore, 'users', uid, 'bookmarks');
  const q = query(bookmarksCol, where('category', '==', oldName));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db as Firestore);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { category: newName });
  });
  await batch.commit();
};

// カテゴリの削除（全ブックマークからそのカテゴリを除去）
export const removeCategoryAcrossBookmarks = async (uid: string, categoryName: string) => {
  const bookmarksCol = collection(db as Firestore, 'users', uid, 'bookmarks');
  const q = query(bookmarksCol, where('category', '==', categoryName));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db as Firestore);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { category: null });
  });
  await batch.commit();
};
