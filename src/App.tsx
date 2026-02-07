import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Bookmark, ViewMode } from './types';
import { parseBookmarks } from './utils/parser';
import { fetchOGP } from './utils/ogp';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { Download, HelpCircle, Globe, Trash2, RefreshCw, Plus } from 'lucide-react';
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
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray()) || [];
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

  const handleFileLoaded = async (content: string) => {
    const parsed = parseBookmarks(content);
    await db.bookmarks.bulkPut(parsed);
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

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all data?')) {
      await db.bookmarks.clear();
    }
  };

  const processingIds = useMemo(() => new Set<number>(), []);

  // OGP fetcher
  useEffect(() => {
    const fetchMetadata = async () => {
      const pending = bookmarks.filter(b => b.id && !b.ogp?.loaded && !processingIds.has(b.id)).slice(0, 5);
      if (pending.length === 0) return;

      // Mark as processing
      pending.forEach(b => b.id && processingIds.add(b.id));

      for (const b of pending) {
        if (!b.id) continue;
        try {
          const ogpData = await fetchOGP(b.url);
          await db.bookmarks.update(b.id, { 
            ogp: { ...(ogpData || {}), loaded: true } 
          });
        } catch (e) {
          console.error(e);
          await db.bookmarks.update(b.id, { ogp: { loaded: true } });
        } finally {
          processingIds.delete(b.id);
        }
        // Throttling
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    fetchMetadata();
  }, [bookmarks.filter(b => !b.ogp?.loaded).length]);

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
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-sm"
            >
              <Plus size={18} />
              Add URL
            </button>
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
               <div className="flex gap-4">
                 <button 
                   onClick={handleClearAll}
                   className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1.5"
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
                   className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                 >
                   <RefreshCw size={14} />
                   Import More
                 </button>
               </div>
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
                filteredBookmarks.map((bookmark) => (
                  <BookmarkCard 
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    viewMode={viewMode}
                    onTagClick={(tag) => setFilter(prev => ({ ...prev, selectedTag: tag }))}
                    onAddTag={(tag) => handleAddTag(bookmark.id!, tag)}
                    onRemoveTag={(tag) => handleRemoveTag(bookmark.id!, tag)}
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