import React, { useState, useEffect } from 'react';
import type { Bookmark } from '../types';
import { CATEGORIES } from '../constants/taxonomy';
import { X, Save, Trash2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Bookmark>) => void;
  onDelete: (id: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, bookmark, onClose, onSave, onDelete }) => {
  // 親が bookmark 単位で key を付けて再マウントするため、初期値を props から直接導出する
  // （effect 内 setState を避ける）。
  const [formData, setFormData] = useState<Partial<Bookmark>>(() => ({
    title: bookmark?.title,
    url: bookmark?.url,
    category: bookmark?.category,
  }));
  // タグは生の文字列として保持し、保存時にだけ配列化する。
  // （配列に即時変換するとカンマ・末尾スペースが入力中に消える）
  const [tagsInput, setTagsInput] = useState(() => (bookmark?.tags || []).join(', '));

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !bookmark || bookmark.id === undefined) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave(bookmark.id!, { ...formData, tags });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      onDelete(bookmark.id!);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Bookmark</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              required
              value={formData.url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-500 bg-gray-50"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
             <select
               value={formData.category || ''}
               onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value || undefined }))}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             >
               <option value="">未分類</option>
               {CATEGORIES.map((cat) => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
             <input
               type="text"
               value={tagsInput}
               onChange={(e) => setTagsInput(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               placeholder="React, Design, Tech"
             />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Delete
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
