import { useState, useMemo, useEffect } from 'react';
import type { Bookmark, ViewMode } from './types';
import { parseBookmarks } from './utils/parser';
import { UploadArea } from './UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { Download, HelpCircle, Globe } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval, format, subDays } from 'date-fns';
import { clsx } from 'clsx';

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">How to export bookmarks</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-6 text-sm">
          <li>Open Google Chrome</li>
          <li>Go to Bookmark Manager (Ctrl+Shift+O)</li>
          <li>Click the three dots icon (Top Right)</li>
          <li>Select "Export Bookmarks"</li>
          <li>Upload the exported HTML file here</li>
        </ol>
        <button 
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Default to 365 days ago
  const defaultStartDate = useMemo(() => format(subDays(new Date(), 365), 'yyyy-MM-dd'), []);

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    startDate: defaultStartDate,
    endDate: '',
    selectedTag: '',
  });

  const handleFileLoaded = (content: string) => {
    const parsed = parseBookmarks(content);
    setBookmarks(parsed);
  };

  const handleExport = () => {
    const content = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reading-list-export.json';
    a.click();
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

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach(b => {
      b.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => {
        const searchTerms = filter.search.toLowerCase().split(/\s+/).filter(Boolean);
        const matchesSearch = searchTerms.every(term => 
          b.title.toLowerCase().includes(term) || 
          b.url.toLowerCase().includes(term)
        );

        let matchesDate = true;
        if (filter.startDate || filter.endDate) {
          const bookmarkDate = new Date(b.addDate * 1000);
          const start = filter.startDate ? startOfDay(new Date(filter.startDate)) : new Date(0);
          const end = filter.endDate ? endOfDay(new Date(filter.endDate)) : new Date(8640000000000000);
          matchesDate = isWithinInterval(bookmarkDate, { start, end });
        }

        const matchesTag = !filter.selectedTag || (b.tags && b.tags.includes(filter.selectedTag));

        return matchesSearch && matchesDate && matchesTag;
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
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img src="/icon.svg" alt="Logo" className="w-full h-full scale-110" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reading List Manager</h1>
              <p className="text-sm text-gray-400 font-medium">Manage and organize your curated content</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {bookmarks.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all text-sm font-bold shadow-sm"
              >
                <Download size={18} />
                Export Data
              </button>
            )}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Help & Guide"
            >
              <HelpCircle size={24} />
            </button>
          </div>
        </header>

        {bookmarks.length === 0 ? (
          <UploadArea onFileLoaded={handleFileLoaded} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <button 
                 onClick={() => setBookmarks([])}
                 className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
               >
                 ← Upload different file
               </button>
            </div>
            
            <FilterBar 
              filter={filter} 
              onChange={setFilter} 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={filteredBookmarks.length} 
              availableTags={availableTags}
            />

            <main className={clsx(
              "grid gap-6 transition-all duration-500",
              viewMode === 'grid' 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            )}>
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark, index) => (
                  <BookmarkCard 
                    key={`${bookmark.url}-${index}`} 
                    bookmark={bookmark} 
                    viewMode={viewMode}
                    onTagClick={(tag) => setFilter(prev => ({ ...prev, selectedTag: tag }))}
                    onAddTag={(tag) => handleAddTag(bookmark.url, tag)}
                    onRemoveTag={(tag) => handleRemoveTag(bookmark.url, tag)}
                  />
                ))
              ) : (
                <div className={clsx(
                  "text-center py-32 text-gray-300 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center",
                  "col-span-full"
                )}>
                  <Globe className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-xl font-medium">No results found</p>
                  <p className="text-sm">Try adjusting your search or filters (Current: last 365 days)</p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;