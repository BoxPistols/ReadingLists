import { useState, useMemo } from 'react';
import type { Bookmark } from './types';
import { parseBookmarks } from './utils/parser';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { BookOpen } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
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

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((b) => {
        // Search Filter
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          b.title.toLowerCase().includes(searchLower) ||
          b.url.toLowerCase().includes(searchLower);

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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reading List Manager</h1>
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
              totalCount={filteredBookmarks.length} 
            />

            <div className="space-y-4">
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark, index) => (
                  <BookmarkCard key={`${bookmark.url}-${index}`} bookmark={bookmark} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
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