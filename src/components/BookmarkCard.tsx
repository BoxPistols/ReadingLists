import React from 'react';
import type { Bookmark } from '../types';
import { ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark }) => {
  const date = new Date(bookmark.addDate * 1000); // Unix timestamp is seconds

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
      
      <div className="mt-4 flex items-center text-xs text-gray-400">
        <Calendar size={14} className="mr-1" />
        <span>Added: {format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
      </div>
    </div>
  );
};
