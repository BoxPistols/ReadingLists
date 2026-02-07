import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  syncLocalToFirestore,
  mergeBookmarks,
  subscribeToBookmarks,
} from '../services/firestore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export const useBookmarkSync = () => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  // Get local bookmarks from Dexie
  const localBookmarks = useLiveQuery(() => db.bookmarks.toArray(), []) || [];

  // Initial sync when user logs in
  useEffect(() => {
    if (!user || hasInitialSync) return;

    const performInitialSync = async () => {
      setSyncStatus('syncing');
      try {
        // Merge local and remote bookmarks
        await mergeBookmarks(user.uid);
        setSyncStatus('synced');
        setError(null);
        setHasInitialSync(true);
      } catch (err) {
        console.error('Error during initial sync:', err);
        setSyncStatus('error');
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
    };

    performInitialSync();
  }, [user, hasInitialSync]);

  // Subscribe to Firestore changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToBookmarks(user.uid, async (remoteBookmarks) => {
      try {
        // Update local database with remote changes
        await db.bookmarks.clear();
        await db.bookmarks.bulkAdd(remoteBookmarks);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error updating local bookmarks:', err);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const syncNow = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setSyncStatus('syncing');
    try {
      await syncLocalToFirestore(user.uid);
      setSyncStatus('synced');
      setError(null);
    } catch (err) {
      console.error('Error syncing bookmarks:', err);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  return {
    bookmarks: localBookmarks,
    syncStatus,
    syncNow,
    error,
    isAuthenticated: !!user,
  };
};
