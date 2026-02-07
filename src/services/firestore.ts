import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { db as dexieDb } from '../db';
import type { Bookmark } from '../types';

// Firestore collection path: users/{userId}/bookmarks/{bookmarkId}
const getBookmarksCollection = (userId: string) => {
  return collection(firestore, 'users', userId, 'bookmarks');
};

// Convert Firestore timestamp to Unix timestamp (seconds)
const convertFirestoreTimestamp = (timestamp: unknown): number => {
  if (timestamp instanceof Timestamp) {
    return timestamp.seconds;
  }
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  return Date.now() / 1000;
};

// Add or update a bookmark in Firestore
export const saveBookmarkToFirestore = async (
  userId: string,
  bookmark: Bookmark
): Promise<void> => {
  const bookmarksRef = getBookmarksCollection(userId);
  const bookmarkId = bookmark.id ? bookmark.id.toString() : `${Date.now()}`;
  const bookmarkDoc = doc(bookmarksRef, bookmarkId);

  await setDoc(bookmarkDoc, {
    ...bookmark,
    addDate: bookmark.addDate,
    lastModified: bookmark.lastModified || Date.now() / 1000,
  });
};

// Delete a bookmark from Firestore
export const deleteBookmarkFromFirestore = async (
  userId: string,
  bookmarkId: string
): Promise<void> => {
  const bookmarksRef = getBookmarksCollection(userId);
  const bookmarkDoc = doc(bookmarksRef, bookmarkId);
  await deleteDoc(bookmarkDoc);
};

// Fetch all bookmarks from Firestore
export const fetchBookmarksFromFirestore = async (
  userId: string
): Promise<Bookmark[]> => {
  const bookmarksRef = getBookmarksCollection(userId);
  const q = query(bookmarksRef);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: parseInt(doc.id),
      title: data.title,
      url: data.url,
      addDate: convertFirestoreTimestamp(data.addDate),
      lastModified: convertFirestoreTimestamp(data.lastModified),
      icon: data.icon,
      tags: data.tags || [],
      image: data.image,
      ogp: data.ogp,
    } as Bookmark;
  });
};

// Sync local Dexie data to Firestore
export const syncLocalToFirestore = async (userId: string): Promise<void> => {
  const localBookmarks = await dexieDb.bookmarks.toArray();
  
  for (const bookmark of localBookmarks) {
    await saveBookmarkToFirestore(userId, bookmark);
  }
};

// Sync Firestore data to local Dexie
export const syncFirestoreToLocal = async (userId: string): Promise<void> => {
  const firestoreBookmarks = await fetchBookmarksFromFirestore(userId);
  
  // Clear local database
  await dexieDb.bookmarks.clear();
  
  // Add all Firestore bookmarks to local database
  for (const bookmark of firestoreBookmarks) {
    await dexieDb.bookmarks.add(bookmark);
  }
};

// Listen to real-time updates from Firestore
export const subscribeToBookmarks = (
  userId: string,
  onUpdate: (bookmarks: Bookmark[]) => void
): Unsubscribe => {
  const bookmarksRef = getBookmarksCollection(userId);
  const q = query(bookmarksRef);

  return onSnapshot(q, (snapshot) => {
    const bookmarks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        title: data.title,
        url: data.url,
        addDate: convertFirestoreTimestamp(data.addDate),
        lastModified: convertFirestoreTimestamp(data.lastModified),
        icon: data.icon,
        tags: data.tags || [],
        image: data.image,
        ogp: data.ogp,
      } as Bookmark;
    });
    onUpdate(bookmarks);
  });
};

// Merge local and remote bookmarks (conflict resolution)
export const mergeBookmarks = async (userId: string): Promise<void> => {
  const localBookmarks = await dexieDb.bookmarks.toArray();
  const firestoreBookmarks = await fetchBookmarksFromFirestore(userId);
  
  // Create a map of remote bookmarks by URL
  const remoteMap = new Map(
    firestoreBookmarks.map((b) => [b.url, b])
  );
  
  // Merge logic: prefer newer lastModified timestamp
  for (const localBookmark of localBookmarks) {
    const remoteBookmark = remoteMap.get(localBookmark.url);
    
    if (remoteBookmark) {
      const localModified = localBookmark.lastModified || localBookmark.addDate;
      const remoteModified = remoteBookmark.lastModified || remoteBookmark.addDate;
      
      if (remoteModified > localModified) {
        // Remote is newer, update local
        await dexieDb.bookmarks.put(remoteBookmark);
      } else if (localModified > remoteModified) {
        // Local is newer, update remote
        await saveBookmarkToFirestore(userId, localBookmark);
      }
      
      remoteMap.delete(localBookmark.url);
    } else {
      // Local bookmark doesn't exist in remote, push to remote
      await saveBookmarkToFirestore(userId, localBookmark);
    }
  }
  
  // Add remaining remote bookmarks to local
  for (const remoteBookmark of remoteMap.values()) {
    await dexieDb.bookmarks.add(remoteBookmark);
  }
};
