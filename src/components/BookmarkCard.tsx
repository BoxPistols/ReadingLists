import React, { useState } from 'react';
import type { Bookmark } from '../types';
import { ExternalLink, Calendar, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onAddTag, onRemoveTag }) => {
  const date = new Date(bookmark.addDate * 1000);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate block"
            title={bookmark.title}
          >
            {bookmark.title || bookmark.url}
          </a>
          <p className="text-sm text-gray-500 truncate mt-1 font-mono">
            {bookmark.url}
          </p>
        </div>
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <ExternalLink size={20} />
        </a>
      </div>
      
      <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4">
        <div className="flex items-center text-xs text-gray-400">
          <Calendar size={14} className="mr-1" />
          <span>{format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {bookmark.tags?.map((tag, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {tag}
              <button 
                onClick={() => onRemoveTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {isAddingTag ? (
            <form onSubmit={handleAddTagSubmit} className="flex items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-24 text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="New tag..."
                autoFocus
                onBlur={() => {
                   // Delay hiding so form submission can happen if clicked/entered
                   setTimeout(() => {
                     if (!newTag) setIsAddingTag(false); 
                   }, 100);
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Plus size={12} className="mr-1" />
              Tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
