import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { subscribeBookmarks } from '../repo/bookmarksRepo';
import type { Bookmark, SyncStatus } from '../types';

// Firestore のリアルタイム購読を React state に橋渡しする。
// useLiveQuery(Dexie) の置換: ログインユーザーが変わると購読を貼り直す。
export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeBookmarks(
      user.uid,
      (next, nextStatus) => {
        setBookmarks(next);
        setStatus(nextStatus);
        setLoaded(true);
      },
      (err) => {
        console.error('Bookmark subscription error:', err);
        setLoaded(true);
      },
    );
    return unsub;
  }, [user]);

  return { bookmarks, status, loaded };
};
