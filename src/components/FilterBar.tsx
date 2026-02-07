import React from 'react';
import { Search, ArrowUpDown, Calendar, LayoutList, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '../types';
import { clsx } from 'clsx';

export interface FilterState {
  search: string;
  sortBy: 'date' | 'title';
  sortOrder: 'asc' | 'desc';
  startDate: string;
  endDate: string;
}

interface FilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  filter, 
  onChange, 
  viewMode, 
  onViewModeChange, 
  totalCount 
}) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    onChange({ ...filter, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search titles or URLs..."
            value={filter.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Layout Toggle & Sort */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onViewModeChange('list')}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
              title="List View"
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={20} className="text-gray-400" />
            <select
              value={filter.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value as 'date' | 'title')}
              className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>
            <select
              value={filter.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>Filter by Date:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>to</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="ml-auto font-medium text-gray-900">
          Found: {totalCount} bookmarks
        </div>
      </div>
    </div>
  );
};
