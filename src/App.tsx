import { useState, useMemo, useEffect } from 'react';
import type { Bookmark, ViewMode } from './types';
import { parseBookmarks } from './utils/parser';
import { fetchOGP } from './utils/ogp';
import { generateBookmarkHtml, downloadHtml } from './utils/exporter';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { HelpModal } from './components/HelpModal';
import { HelpCircle, Download } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { clsx } from 'clsx';

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
  });

  const handleFileLoaded = (content: string) => {
    const parsed = parseBookmarks(content);
    setBookmarks(parsed);
  };

  // OGP fetcher logic
  useEffect(() => {
    const fetchMetadata = async () => {
      // まだ読み込まれていないものを抽出 (最大5つずつ並行実行)
      const pending = bookmarks.filter(b => !b.ogp?.loaded);
      if (pending.length === 0) return;

      const batchSize = 3;
      for (let i = 0; i < pending.length; i += batchSize) {
        const batch = pending.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (b) => {
          const ogpData = await fetchOGP(b.url);
          setBookmarks(prev => prev.map(item => {
            if (item.url === b.url) {
              return { 
                ...item, 
                ogp: { ...ogpData, loaded: true } 
              };
            }
            return item;
          }));
        }));
        
        // 少し待機してプロキシへの負荷を軽減
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };

    if (bookmarks.length > 0) {
      fetchMetadata();
    }
  }, [bookmarks.filter(b => !b.ogp?.loaded).length > 0]);

  const handleExport = () => {
    const html = generateBookmarkHtml(bookmarks);
    downloadHtml(html, `reading_list_export_${new Date().toISOString().slice(0, 10)}.html`);
  };

  const handleAddTag = (bookmarkUrl: string, tag: string) => {
    setBookmarks(prev => prev.map(b => {
      if (b.url === bookmarkUrl) {
        const currentTags = b.tags || [];
        if (!currentTags.includes(tag)) {
          return { ...b, tags: [...currentTags, tag] };
        }
      }
      return b;
    }));
  };

  const handleRemoveTag = (bookmarkUrl: string, tagToRemove: string) => {
    setBookmarks(prev => prev.map(b => {
      if (b.url === bookmarkUrl) {
        return { ...b, tags: (b.tags || []).filter(t => t !== tagToRemove) };
      }
      return b;
    }));
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => {
        // Search Filter
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          b.title.toLowerCase().includes(searchLower) ||
          b.url.toLowerCase().includes(searchLower) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(searchLower))); // Search in tags too

        // Date Filter
        let matchesDate = true;
        if (filter.startDate || filter.endDate) {
          const bookmarkDate = new Date(b.addDate * 1000);
          const start = filter.startDate ? startOfDay(new Date(filter.startDate)) : new Date(0);
          const end = filter.endDate ? endOfDay(new Date(filter.endDate)) : new Date(8640000000000000); // Max Date
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
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/icon.svg" alt="Logo" className="w-full h-full scale-110" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reading List Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            {bookmarks.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Export current list to HTML"
              >
                <Download size={18} />
                Export HTML
              </button>
            )}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Help & Guide"
            >
              <HelpCircle size={24} />
            </button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <UploadArea onFileLoaded={handleFileLoaded} />
        ) : (
          <>
            <div className="flex justify-end mb-4">
               <button 
                 onClick={() => setBookmarks([])}
                 className="text-sm text-gray-500 hover:text-red-600 underline"
               >
                 Upload a different file
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
              "gap-4",
              viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2" : "space-y-4"
            )}>
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark, index) => (
                  <BookmarkCard 
                    key={`${bookmark.url}-${index}`} 
                    bookmark={bookmark}
                    onAddTag={(tag) => handleAddTag(bookmark.url, tag)}
                    onRemoveTag={(tag) => handleRemoveTag(bookmark.url, tag)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                  No bookmarks found matching your criteria.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}export default App;
