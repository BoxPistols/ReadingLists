import { useState, useMemo } from 'react';
import type { Bookmark, ViewMode } from './types';
import { parseBookmarks } from './utils/parser';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { Download, HelpCircle, Globe } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { clsx } from 'clsx';

// Minimal Help Modal
const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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

  const handleExport = () => {
    // Basic implementation for demonstration
    const content = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reading-list-export.json';
    a.click();
  };

  const filteredBookmarks = useMemo(() => {
    // 検索ワードをスペース（全角・半角）で分割して配列化
    const searchWords = filter.search.toLowerCase().trim().split(/[\s ]+|\s +/).filter(Boolean);

    return bookmarks
      .filter((b) => {
        // AND Search: すべての単語が含まれているか確認
        const matchesSearch = searchWords.length === 0 || searchWords.every(word => 
          b.title.toLowerCase().includes(word) ||
          b.url.toLowerCase().includes(word) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(word)))
        );

        // Date Filter
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
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <div className="max-w-7xl mx-auto">
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
            />

            <main className={clsx(
              "transition-all duration-500",
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                : "max-w-4xl mx-auto space-y-4"
            )}>
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark, index) => (
                  <BookmarkCard 
                    key={`${bookmark.url}-${index}`} 
                    bookmark={bookmark} 
                    viewMode={viewMode}
                  />
                ))
              ) : (
                <div className={clsx(
                  "text-center py-32 text-gray-300 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center",
                  viewMode === 'grid' && "col-span-full"
                )}>
                  <Globe className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-xl font-medium">No results found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
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