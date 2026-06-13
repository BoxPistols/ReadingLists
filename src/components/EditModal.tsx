import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Bookmark } from '../types';
import { X, Save, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { uploadBookmarkImage } from '../repo/bookmarksRepo';
import Cropper from 'react-easy-crop';
import { getCroppedImgBase64 } from '../utils/canvasUtils';

interface EditModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  categories: string[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Bookmark>) => void;
  onDelete: (id: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, bookmark, categories, onClose, onSave, onDelete }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Bookmark>>(() => ({
    title: bookmark?.title,
    url: bookmark?.url,
    category: bookmark?.category,
    image: bookmark?.image || bookmark?.ogp?.image,
  }));
  
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(formData.image || '');
  const [tagsInput, setTagsInput] = useState(() => (bookmark?.tags || []).join(', '));

  // Cropping states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImageToCrop(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imageToCrop) {
          setImageToCrop(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, imageToCrop]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageToCrop || !croppedAreaPixels || !user || !bookmark.id) {
      return;
    }

    try {
      setIsUploading(true);
      const base64Image = await getCroppedImgBase64(imageToCrop, croppedAreaPixels);
      
      if (base64Image) {
        setFormData(prev => ({ ...prev, image: base64Image }));
        setImageToCrop(null);
      }
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('画像の加工に失敗しました。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      onDelete(bookmark.id!);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onPaste={handlePaste}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Edit Bookmark</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Preview and Replacement */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview Image</label>
            <div 
              className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (event) => setImageToCrop(event.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            >
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={48} strokeWidth={1} />
                  <span className="text-xs mt-2">No Preview Image</span>
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                  title="Upload Image"
                >
                  <Upload size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                  className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                  title="Image URL"
                >
                  <LinkIcon size={20} />
                </button>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, image: undefined }));
                      setImageUrlInput('');
                    }}
                    className="p-3 bg-white/20 hover:bg-red-500/40 rounded-full text-white backdrop-blur-md transition-all"
                    title="Remove Image"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Cropping UI Overlay */}
              {imageToCrop && (
                <div className="absolute inset-0 z-30 bg-black">
                  <div className="relative w-full h-full">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={16 / 10}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-40">
                    <button
                      type="button"
                      onClick={() => setImageToCrop(null)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCropSave}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Check size={14} />
                      Crop & Upload
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showImageUrlInput && (
              <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, image: imageUrlInput }));
                    setShowImageUrlInput(false);
                  }}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            <p className="text-[10px] text-gray-400 mt-2">
              画像をアップロード、ドロップ、または <strong>Cmd+V でペースト</strong>して差し替え・調整できます。
            </p>
          </div>

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
               {categories.map((cat) => (
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

          <div className="pt-4 flex items-center justify-between sticky bottom-0 bg-white pb-2">
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
                disabled={isUploading || !!imageToCrop}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
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
