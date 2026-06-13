import React from 'react';
import { Search, ArrowUpDown, Calendar, LayoutList, LayoutGrid, Table, Tag, Folder, X } from 'lucide-react';
import type { ViewMode, SortBy } from '../types';
import { clsx } from 'clsx';

export interface FilterState {
  search: string;
  sortBy: SortBy;
  sortOrder: 'asc' | 'desc';
  startDate: string;
  endDate: string;
  selectedTags: string[];
  selectedCategories: string[];
}

interface FilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  availableTags: string[];
  availableCategories: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChange,
  viewMode,
  onViewModeChange,
  totalCount,
  availableTags,
  availableCategories
}) => {
  const handleChange = (key: keyof FilterState, value: any) => {
    onChange({ ...filter, [key]: value });
  };

  const toggleMultiSelect = (key: 'selectedTags' | 'selectedCategories', value: string) => {
    const current = filter[key] as string[];
    if (current.includes(value)) {
      handleChange(key, current.filter(v => v !== value));
    } else {
      handleChange(key, [...current, value]);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col md:flex-row items-center gap-2">
        {/* Search Field */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search (e.g. 'A B' for AND search)..."
            value={filter.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-11 pr-11 py-3 bg-gray-50/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
          />
          {filter.search && (
            <button
              onClick={() => handleChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500 rounded-full transition-colors"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
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
              onChange={(e) => handleChange('sortBy', e.target.value as SortBy)}
              className="bg-transparent text-xs font-medium text-gray-600 px-2 py-1 cursor-pointer outline-none"
            >
              <option value="date">作成日順</option>
              <option value="lastModified">更新日順</option>
              <option value="manual">カスタム順</option>
            </select>
            <button
              onClick={() => handleChange('sortOrder', filter.sortOrder === 'asc' ? 'desc' : 'asc')}
              className={clsx(
                "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all",
                filter.sortBy === 'manual' && "opacity-20 pointer-events-none"
              )}
              title={filter.sortOrder === 'asc' ? '昇順' : '降順'}
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
              title="List View"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
              title="Table View"
            >
              <Table size={18} />
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

      {/* Multi-select Pills and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
            <Folder size={14} className="text-gray-400" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleMultiSelect('selectedCategories', e.target.value);
                e.target.value = '';
              }}
              className="bg-transparent text-xs font-medium text-gray-600 outline-none cursor-pointer min-w-[120px]"
            >
              <option value="">+ カテゴリを追加</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} disabled={filter.selectedCategories.includes(cat)}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
            <Tag size={14} className="text-gray-400" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleMultiSelect('selectedTags', e.target.value);
                e.target.value = '';
              }}
              className="bg-transparent text-xs font-medium text-gray-600 outline-none cursor-pointer min-w-[100px]"
            >
              <option value="">+ タグを追加</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag} disabled={filter.selectedTags.includes(tag)}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {filter.selectedCategories.map(cat => (
            <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
              <Folder size={10} />
              {cat}
              <button onClick={() => toggleMultiSelect('selectedCategories', cat)} className="hover:text-blue-800">
                <X size={10} />
              </button>
            </span>
          ))}
          {filter.selectedTags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
              <Tag size={10} />
              {tag}
              <button onClick={() => toggleMultiSelect('selectedTags', tag)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
          {(filter.selectedCategories.length > 0 || filter.selectedTags.length > 0) && (
            <button
              onClick={() => {
                handleChange('selectedCategories', []);
                handleChange('selectedTags', []);
              }}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest ml-2"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};