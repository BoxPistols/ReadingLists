import { useState, useMemo, useEffect } from 'react';
import type { Bookmark, ViewMode } from './types';
import { useAuth } from './auth/AuthContext';
import { useBookmarks } from './hooks/useBookmarks';
import {
  addBookmark,
  bulkAddBookmarks,
  updateBookmark,
  removeBookmark,
  clearAllBookmarks,
  updateBookmarkPositions,
} from './repo/bookmarksRepo';
import {
  getGeneralSettings,
  saveGeneralSettings,
  renameCategoryAcrossBookmarks,
  removeCategoryAcrossBookmarks,
} from './repo/settingsRepo';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants/taxonomy';
import { parseBookmarks } from './utils/parser';
import { UploadArea } from './components/UploadArea';
import { BookmarkCard } from './components/BookmarkCard';
import { FilterBar, type FilterState } from './components/FilterBar';
import { EditModal } from './components/EditModal';
import { CategoryModal } from './components/CategoryModal';
import { UrlAddBar } from './components/UrlAddBar';
import { AuthButton } from './components/AuthButton';
import { SyncIndicator } from './components/SyncIndicator';
import { Download, HelpCircle, Globe, Trash2, RefreshCw, Loader2, Settings2 } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { clsx } from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

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
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, status, loaded } = useBookmarks();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    startDate: '', // デフォルトは無制限
    endDate: '',
    selectedTags: [],
    selectedCategories: [],
  });

  // 設定のロード
  useEffect(() => {
    if (user) {
      getGeneralSettings(user.uid).then((settings) => {
        if (settings) {
          if (settings.categories) setCustomCategories(settings.categories);
          if (settings.filter) setFilter(prev => ({ ...prev, ...settings.filter }));
          if (settings.viewMode) setViewMode(settings.viewMode);
        }
      });
    }
  }, [user]);

  // 設定の保存（フィルタと表示モード）
  useEffect(() => {
    if (user && loaded) {
      const timer = setTimeout(() => {
        saveGeneralSettings(user.uid, { filter, viewMode });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, filter, viewMode, loaded]);

  const handleAddCategory = async (name: string) => {
    if (!user) return;
    const updated = [...customCategories, name];
    setCustomCategories(updated);
    await saveGeneralSettings(user.uid, { categories: updated });
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!user) return;
    const updated = customCategories.map(c => c === oldName ? newName : c);
    setCustomCategories(updated);
    await saveGeneralSettings(user.uid, { categories: updated });
    await renameCategoryAcrossBookmarks(user.uid, oldName, newName);
  };

  const handleDeleteCategory = async (name: string) => {
    if (!user) return;
    const updated = customCategories.filter(c => c !== name);
    setCustomCategories(updated);
    await saveGeneralSettings(user.uid, { categories: updated });
    await removeCategoryAcrossBookmarks(user.uid, name);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (user && over && active.id !== over.id) {
    const oldIndex = sortedBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBookmarks.findIndex((b) => b.id === over.id);

    const newOrder = arrayMove(sortedBookmarks, oldIndex, newIndex);

    // ソート順が降順 (desc) の場合、見た目の index 0 が order の最大値になるように調整
    const positions = newOrder.map((b, index) => ({
      id: b.id!,
      order: filter.sortOrder === 'desc' ? newOrder.length - 1 - index : index,
    }));

    await updateBookmarkPositions(user.uid, positions);
  }
};

  const handleFileLoaded = async (content: string) => {
    if (!user) return;
    const parsed = parseBookmarks(content);
    const existingUrls = new Set(bookmarks.map((b) => b.url));
    const fresh = parsed.filter((b) => !existingUrls.has(b.url));
    if (fresh.length > 0) {
      await bulkAddBookmarks(user.uid, fresh);
    }
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

  const handleAddTag = async (id: string, tag: string) => {
    if (!user) return;
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      const currentTags = bookmark.tags || [];
      if (!currentTags.includes(tag)) {
        await updateBookmark(user.uid, id, { tags: [...currentTags, tag] });
      }
    }
  };

  const handleRemoveTag = async (id: string, tagToRemove: string) => {
    if (!user) return;
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      await updateBookmark(user.uid, id, {
        tags: (bookmark.tags || []).filter((t) => t !== tagToRemove),
      });
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (confirm('Are you sure you want to clear all data?')) {
      await clearAllBookmarks(user.uid);
    }
  };

  const handleSaveEdit = async (id: string, updates: Partial<Bookmark>) => {
    if (!user) return;
    const bookmark = bookmarks.find(b => b.id === id);
    // 既存の ogp 情報を保持しつつ loaded を true にする
    await updateBookmark(user.uid, id, {
      ...updates,
      ogp: {
        ...(bookmark?.ogp || {}),
        loaded: true
      }
    });
  };

  const handleDeleteOne = async (id: string) => {
    if (!user) return;
    await removeBookmark(user.uid, id);
  };

  const handleAddUrl = async (url: string) => {
    if (!user) return;
    let initialTitle = url;
    try {
      initialTitle = new URL(url).hostname;
    } catch {
      /* noop */
    }
    await addBookmark(user.uid, {
      title: initialTitle,
      url,
      addDate: Math.floor(Date.now() / 1000),
      tags: [],
      order: bookmarks.length,
    });
  };

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const searchTerms = filter.search.toLowerCase().split(/\s+/).filter(Boolean);
      const matchesSearch = searchTerms.every(
        (term) =>
          b.title.toLowerCase().includes(term) || b.url.toLowerCase().includes(term),
      );

      let matchesDate = true;
      if (filter.startDate || filter.endDate) {
        const bookmarkDate = new Date(b.addDate * 1000);
        const start = filter.startDate ? startOfDay(new Date(filter.startDate)) : new Date(0);
        const end = filter.endDate ? endOfDay(new Date(filter.endDate)) : new Date(8640000000000000);
        matchesDate = isWithinInterval(bookmarkDate, { start, end });
      }

      const matchesTag = filter.selectedTags.length === 0 || 
        (b.tags && filter.selectedTags.every(t => b.tags!.includes(t)));

      const matchesCategory = filter.selectedCategories.length === 0 || 
        (b.category && filter.selectedCategories.includes(b.category));

      return matchesSearch && matchesDate && matchesTag && matchesCategory;
    });
  }, [bookmarks, filter]);

  const sortedBookmarks = useMemo(() => {
    return [...filteredBookmarks].sort((a, b) => {
      let comparison = 0;
      if (filter.sortBy === 'manual') {
        comparison = (a.order ?? 0) - (b.order ?? 0);
      } else if (filter.sortBy === 'date') {
        comparison = a.addDate - b.addDate;
      } else if (filter.sortBy === 'lastModified') {
        comparison = (a.lastModified ?? a.addDate) - (b.lastModified ?? b.addDate);
      }
      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredBookmarks, filter.sortBy, filter.sortOrder]);

  // 認証 + 初回購読が完了するまでローディング表示。
  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="font-medium">Loading your reading list...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <EditModal
        key={editingBookmark?.id}
        isOpen={editingBookmark !== null}
        bookmark={editingBookmark}
        categories={customCategories}
        onClose={() => setEditingBookmark(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteOne}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={customCategories}
        onAdd={handleAddCategory}
        onRename={handleRenameCategory}
        onDelete={handleDeleteCategory}
      />

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
            <SyncIndicator status={status} />
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
            <AuthButton />
          </div>
        </header>

        {bookmarks.length === 0 ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">URL を追加して始めましょう</h2>
              <p className="text-sm text-gray-400 mt-1">
                貼り付けるだけで OGP 取得と AI 分類を自動で行います
              </p>
            </div>
            <UrlAddBar onAdd={handleAddUrl} />
            <div className="flex items-center gap-3 text-xs text-gray-300 uppercase tracking-widest">
              <div className="h-px bg-gray-100 flex-1" />
              または HTML から一括インポート
              <div className="h-px bg-gray-100 flex-1" />
            </div>
            <UploadArea onFileLoaded={handleFileLoaded} />
          </div>
        ) : (
          <div className="space-y-8">
            <UrlAddBar onAdd={handleAddUrl} />

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

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
              >
                <Settings2 size={14} />
                カテゴリを編集
              </button>
            </div>

            <FilterBar
              filter={filter}
              onChange={setFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={sortedBookmarks.length}
              availableTags={availableTags}
              availableCategories={customCategories}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedBookmarks.map(b => b.id!)}
                strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
              >
                <main
                  className={clsx(
                    'grid transition-all duration-500',
                    viewMode === 'grid' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
                    viewMode === 'list' && 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
                    viewMode === 'table' && 'grid-cols-1 gap-2',
                  )}
                >
                  {sortedBookmarks.length > 0 ? (
                    sortedBookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        viewMode={viewMode}
                        onTagClick={(tag) => setFilter((prev) => ({ ...prev, selectedTags: [tag] }))}
                        onAddTag={(tag) => handleAddTag(bookmark.id!, tag)}
                        onRemoveTag={(tag) => handleRemoveTag(bookmark.id!, tag)}
                        onEdit={() => setEditingBookmark(bookmark)}
                        isSortable={filter.sortBy === 'manual'}
                      />
                    ))
                  ) : (
                    <div
                      className={clsx(
                        'text-center py-32 text-gray-300 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center',
                        'col-span-full',
                      )}
                    >
                      <Globe className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-xl font-medium">No results found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </main>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
