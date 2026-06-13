import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAdd,
  onRename,
  onDelete
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAdd(newCategory.trim());
      setNewCategory('');
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(categories[index]);
  };

  const saveEdit = (oldName: string) => {
    if (editingValue.trim() && editingValue.trim() !== oldName) {
      onRename(oldName, editingValue.trim());
    }
    setEditingIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">カテゴリを管理</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="新しいカテゴリ名..."
            className="flex-1 px-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
          {categories.map((cat, index) => (
            <div key={cat} className="flex items-center gap-2 group">
              {editingIndex === index ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-blue-500 rounded-lg outline-none text-sm"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(cat)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                    {cat}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(index)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`カテゴリ「${cat}」を削除してもよろしいですか？\nこのカテゴリが割り当てられている全てのブックマークからカテゴリが解除されます。`)) {
                          onDelete(cat);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
              <AlertCircle size={32} className="mb-2 opacity-20" />
              <p className="text-sm">カテゴリがありません</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};