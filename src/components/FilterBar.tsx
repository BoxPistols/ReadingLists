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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex flex-col md:flex-row items-center gap-2">
      {/* Search Field */}
      <div className="relative flex-1 w-full md:w-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search your reading list..."
          value={filter.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
        {/* Date Filter */}
        <div className="flex items-center bg-gray-50/50 rounded-xl px-3 py-1.5 gap-2 border border-transparent hover:border-gray-200 transition-colors">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="bg-transparent text-xs outline-none text-gray-600 cursor-pointer"
          />
          <span className="text-gray-300">-</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="bg-transparent text-xs outline-none text-gray-600 cursor-pointer"
          />
        </div>

        <div className="h-8 w-px bg-gray-100 mx-1 hidden md:block" />

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-xl border border-transparent">
          <select
            value={filter.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value as 'date' | 'title')}
            className="bg-transparent text-xs font-medium text-gray-600 px-2 py-1 cursor-pointer outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>
          <button
            onClick={() => handleChange('sortOrder', filter.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
            title={filter.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-100 mx-1 hidden md:block" />

        {/* View Switcher */}
        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-transparent">
          <button
            onClick={() => onViewModeChange('list')}
            className={clsx(
              "p-1.5 rounded-lg transition-all",
              viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={clsx(
              "p-1.5 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
      
      {totalCount > 0 && (
        <div className="px-4 py-1 hidden lg:block">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            {totalCount} Items
          </span>
        </div>
      )}
    </div>
  );
};