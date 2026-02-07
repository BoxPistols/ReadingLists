import React, { useState } from 'react';
import type { Bookmark } from '../types';
import { ExternalLink, Calendar, Plus, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onEdit: (bookmark: Bookmark) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onAddTag, onRemoveTag, onEdit }) => {
  const date = new Date(bookmark.addDate * 1000);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const ogpImage = bookmark.ogp?.image;

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group/card relative">
      {/* OGP Image */}
      <div className="aspect-video w-full bg-gray-50 relative overflow-hidden group">
        {ogpImage ? (
          <img 
            src={ogpImage} 
            alt={bookmark.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Edit2 size={40} strokeWidth={1} className="opacity-20" />
          </div>
        )}
        
        {/* Actions Overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => onEdit(bookmark)}
            className="flex items-center justify-center p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-colors opacity-0 group-hover/card:opacity-100"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1 min-w-0">
          <h3 
            className="text-base font-bold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1 cursor-pointer"
            onClick={() => onEdit(bookmark)}
          >
            {bookmark.ogp?.title || bookmark.title || bookmark.url}
          </h3>
          <p className="text-[10px] text-gray-400 truncate font-mono mb-2">
            {bookmark.url}
          </p>
          {bookmark.ogp?.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
              {bookmark.ogp.description}
            </p>
          )}
        </div>
        
        <div className="mt-auto flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-[10px] text-gray-400">
            <Calendar size={12} className="mr-1" />
            <span>{format(date, 'yyyy/MM/dd', { locale: ja })}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {bookmark.tags?.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {tag}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTag(tag);
                  }}
                  className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <form onSubmit={handleAddTagSubmit} className="flex items-center">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-20 text-[10px] border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Tag..."
                  autoFocus
                  onBlur={() => {
                     setTimeout(() => {
                       if (!newTag) setIsAddingTag(false); 
                     }, 150);
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-400 hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <Plus size={10} className="mr-0.5" />
                Tag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};