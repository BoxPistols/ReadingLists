import React from 'react';
import type { Bookmark, ViewMode } from '../types';
import { ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: ViewMode;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, viewMode }) => {
  const date = new Date(bookmark.addDate * 1000);
  const hostname = new URL(bookmark.url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  
  // OGP Thumbnail with Microlink
  const thumbnailUrl = bookmark.image || `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;

  if (viewMode === 'grid') {
    return (
      <article className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
        {/* Image Section with Fixed Aspect Ratio */}
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
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-4 h-4 rounded-sm"
              onError={(e) => (e.target as any).style.display='none'}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 truncate">
              {hostname}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.title || bookmark.url}
            </a>
          </h3>
          
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={14} />
              <span>{format(date, 'yyyy/MM/dd', { locale: ja })}</span>
            </div>
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
      </article>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all flex gap-5 items-center group">
      <div className="w-32 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-50">
        <img 
          src={thumbnailUrl} 
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/200x120/f3f4f6/9ca3af?text=No+Preview';
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <img src={faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{hostname}</span>
        </div>
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-bold text-gray-900 hover:text-blue-600 truncate block transition-colors"
        >
          {bookmark.title || bookmark.url}
        </a>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={14} />
            <span>Added on {format(date, 'yyyy年MM月dd日', { locale: ja })}</span>
          </div>
          <span className="text-xs text-gray-300 font-mono truncate max-w-[300px]">{bookmark.url}</span>
        </div>
      </div>
      
      <a 
        href={bookmark.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
      >
        <ExternalLink size={20} />
      </a>
    </div>
  );
};
