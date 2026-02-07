import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Bookmark, ViewMode } from './types';
import { parseBookmarks } from './utils/parser';
import { fetchOGP } from './utils/ogp';
import { generateBookmarkHtml, downloadHtml } from './utils/exporter';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { HelpModal } from './components/HelpModal';
import { EditModal } from './components/EditModal';
import { HelpCircle, Download, Plus, Trash2 } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { clsx } from 'clsx';

function App() {
  // DBから全件取得（リアルタイム監視）
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray()) || [];
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
  });

  // ファイル読み込み：DBにバルク保存
  const handleFileLoaded = async (content: string) => {
    const parsed = parseBookmarks(content);
    // URLの重複を除去してインポート
    await db.bookmarks.bulkPut(parsed);
  };

  const handleExport = () => {
    const html = generateBookmarkHtml(bookmarks);
    downloadHtml(html, `reading_list_export_${new Date().toISOString().slice(0, 10)}.html`);
  };

  const handleAddTag = async (id: number, tag: string) => {
    const bookmark = await db.bookmarks.get(id);
    if (bookmark) {
      const currentTags = bookmark.tags || [];
      if (!currentTags.includes(tag)) {
        await db.bookmarks.update(id, { tags: [...currentTags, tag] });
      }
    }
  };

  const handleRemoveTag = async (id: number, tagToRemove: string) => {
    const bookmark = await db.bookmarks.get(id);
    if (bookmark) {
      await db.bookmarks.update(id, { 
        tags: (bookmark.tags || []).filter(t => t !== tagToRemove) 
      });
    }
  };

  const handleSaveEdit = async (id: number, updates: Partial<Bookmark>) => {
    await db.bookmarks.update(id, updates);
  };

  const handleDelete = async (id: number) => {
    await db.bookmarks.delete(id);
  };

  const handleClearAll = async () => {
    if (confirm('全てのブックマークを削除しますか？')) {
      await db.bookmarks.clear();
    }
  };

  // OGP fetcher (DB更新を伴う)
  useEffect(() => {
    const fetchMetadata = async () => {
      const pending = bookmarks.filter(b => !b.ogp?.loaded).slice(0, 20);
      if (pending.length === 0) return;

      const batchSize = 2;
      for (let i = 0; i < pending.length; i += batchSize) {
        const batch = pending.slice(i, i + batchSize);
        await Promise.all(batch.map(async (b) => {
          if (!b.id) return;
          const ogpData = await fetchOGP(b.url);
          await db.bookmarks.update(b.id, { 
            ogp: { ...ogpData, loaded: true } 
          });
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    if (bookmarks.length > 0) {
      fetchMetadata();
    }
  }, [bookmarks.filter(b => !b.ogp?.loaded).length]);

  const filteredBookmarks = useMemo(() => {
    const searchWords = filter.search.toLowerCase().trim().split(/[\s　]+/).filter(Boolean);

    return bookmarks
      .filter((b) => {
        const matchesSearch = searchWords.length === 0 || searchWords.every(word => 
          b.title.toLowerCase().includes(word) ||
          b.url.toLowerCase().includes(word) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(word)))
        );

        let matchesDate = true;
        if (filter.startDate || filter.endDate) {
          const bookmarkDate = new Date(b.addDate * 1000);
          const start = filter.startDate ? startOfDay(new Date(filter.startDate)) : new Date(0);
          const end = filter.endDate ? endOfDay(new Date(filter.endDate)) : new Date(8640000000000000);
          matchesDate = isWithinInterval(bookmarkDate, { start, end });
        }

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (filter.sortBy === 'date') {
          comparison = a.addDate - b.addDate;
        } else {
          comparison = a.title.localeCompare(b.title);
        }
        return filter.sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [bookmarks, filter]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <EditModal 
        isOpen={!!editingBookmark} 
        bookmark={editingBookmark} 
        onClose={() => setEditingBookmark(null)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/icon.svg" alt="Logo" className="w-full h-full scale-110" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reading List Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) {
                  db.bookmarks.add({
                    title: url,
                    url,
                    addDate: Math.floor(Date.now() / 1000),
                    tags: []
                  });
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              Add
            </button>
            {bookmarks.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={18} />
                Export HTML
              </button>
            )}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <HelpCircle size={24} />
            </button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <UploadArea onFileLoaded={handleFileLoaded} />
        ) : (
          <>
            <div className="flex justify-between items-end mb-4">
               <button 
                 onClick={handleClearAll}
                 className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
               >
                 <Trash2 size={14} />
                 Clear All Data
               </button>
               <button 
                 onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.html';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => handleFileLoaded(event.target?.result as string);
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                 }}
                 className="text-sm text-blue-600 hover:underline"
               >
                 Import more files
               </button>
            </div>
            
            <FilterBar 
              filter={filter} 
              onChange={setFilter} 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={filteredBookmarks.length} 
            />

            <div className={clsx(
              "gap-6",
              viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
            )}>
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark) => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark}
                    onAddTag={(tag) => handleAddTag(bookmark.id!, tag)}
                    onRemoveTag={(tag) => handleRemoveTag(bookmark.id!, tag)}
                    onEdit={setEditingBookmark}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-24 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  No bookmarks found matching your criteria.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
