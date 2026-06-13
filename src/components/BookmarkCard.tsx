import React, { useState } from 'react';
import type { Bookmark, ViewMode } from '../types';
import { ExternalLink, Calendar, Tag, Plus, X, Pencil, Folder, Loader2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: ViewMode;
  onTagClick?: (tag: string) => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onEdit?: () => void;
  isSortable?: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  viewMode,
  onTagClick,
  onAddTag,
  onRemoveTag,
  onEdit,
  isSortable = false
}) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: bookmark.id!, disabled: !isSortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };
  
  const date = new Date(bookmark.addDate * 1000);
  const hostname = new URL(bookmark.url).hostname;
  const faviconUrl = bookmark.icon || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  const thumbnailUrl = bookmark.image || bookmark.ogp?.image || `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && onAddTag) {
      onAddTag(newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const renderTags = (isCompact = false) => (
    <div className={`flex flex-wrap gap-1.5 items-center ${isCompact ? 'max-w-[200px]' : ''}`}>
      {bookmark.tags?.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 group/tag hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          <button onClick={() => onTagClick?.(tag)} className="flex items-center gap-1">
            <Tag size={10} />
            {tag}
          </button>
          <button 
            onClick={() => onRemoveTag?.(tag)}
            className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      
      {isAddingTag ? (
        <form onSubmit={handleAddTagSubmit} className="flex items-center animate-in fade-in zoom-in duration-200">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="w-20 text-[10px] border border-blue-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Tag..."
            autoFocus
            onBlur={() => {
              if (!newTag) setIsAddingTag(false);
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setIsAddingTag(true)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Add Tag"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );

  // 2分以上経過しても分類が終わらない場合は AI 分類失敗とみなして表示を消す。
  const isStuckClassifying = !bookmark.category && !bookmark.ogp?.loaded && (Date.now() / 1000 - bookmark.addDate > 120);

  const categoryBadge = bookmark.category ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 whitespace-nowrap flex-shrink-0">
      <Folder size={10} /> {bookmark.category}
    </span>
  ) : (!bookmark.ogp?.loaded && !isStuckClassifying) ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-400 whitespace-nowrap flex-shrink-0">
      <Loader2 size={10} className="animate-spin" /> 分類中…
    </span>
  ) : null;

  const SortHandle = isSortable && (
    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-600">
      <GripVertical size={20} />
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <article ref={setNodeRef} style={style} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 border-b border-gray-50">
          <img 
            src={thumbnailUrl} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?auto=format&fit=crop&q=80&w=600&bg=f3f4f6';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
             <span className="text-white text-xs font-medium flex items-center gap-1.5">
               <ExternalLink size={14} /> View Source
             </span>
          </div>
          {isSortable && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {SortHandle}
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3 min-w-0">
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-4 h-4 rounded-sm flex-shrink-0"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 truncate flex-1">
              {hostname}
            </span>
            {categoryBadge}
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.title || bookmark.url}
            </a>
          </h3>

          <div className="mb-4">
            {renderTags()}
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
              <Calendar size={14} />
              <span>{format(date, 'yyyy/MM/dd', { locale: ja })}</span>
            </div>
            <div className="flex items-center">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
              )}
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (viewMode === 'table') {
    return (
      <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-2 hover:shadow-md transition-all flex items-center group/card min-w-0 gap-4">
        {SortHandle}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-4 h-4 rounded-sm flex-shrink-0"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <div className="flex flex-col min-w-0">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-bold text-gray-900 hover:text-blue-600 truncate transition-colors"
            >
              {bookmark.title || bookmark.url}
            </a>
            <span className="text-[10px] text-gray-400 truncate uppercase tracking-tight">{hostname}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {categoryBadge}
          <div className="h-4 w-px bg-gray-100" />
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 whitespace-nowrap">
            <Calendar size={12} />
            <span>{format(date, 'yyyy/MM/dd', { locale: ja })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  // Default List View - Updated to show image and maximize title space
  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-all flex gap-4 sm:gap-5 items-center group/card relative">
      {SortHandle}
      <div className="w-24 h-16 sm:w-32 sm:h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
        <img 
          src={thumbnailUrl} 
          alt=""
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/200x120/f3f4f6/9ca3af?text=No+Preview';
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 min-w-0 overflow-hidden pr-12">
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">{hostname}</span>
          {categoryBadge}
        </div>
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-base font-bold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors pr-8"
        >
          {bookmark.title || bookmark.url}
        </a>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
            <Calendar size={14} />
            <span>Added on {format(date, 'yyyy年MM月dd日', { locale: ja })}</span>
          </div>
          {renderTags()}
        </div>
      </div>
      
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-all bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-100">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
        )}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
};