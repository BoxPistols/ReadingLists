import React, { useState, useEffect } from 'react';
import type { Bookmark } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Bookmark>) => void;
  onDelete: (id: number) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, bookmark, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Bookmark>>({});

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        tags: bookmark.tags || [],
      });
    }
  }, [bookmark]);

  if (!isOpen || !bookmark || bookmark.id === undefined) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(bookmark.id!, formData);
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
             <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
             <input
               type="text"
               value={formData.tags?.join(', ') || ''}
               onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
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
