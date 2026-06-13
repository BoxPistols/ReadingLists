import { useState } from 'react';
import { Plus, Link as LinkIcon, Sparkles } from 'lucide-react';

interface UrlAddBarProps {
  onAdd: (url: string) => void | Promise<void>;
}

// URL を貼って登録する主役の入力。追加後は Cloud Function が OGP と AI 分類を付与する。
export const UrlAddBar: React.FC<UrlAddBarProps> = ({ onAdd }) => {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const normalize = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // スキーム省略時は https を補う。
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(withScheme).href;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalize(url);
    if (!normalized) return;
    setBusy(true);
    try {
      await onAdd(normalized);
      setUrl('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center gap-2"
    >
      <div className="relative flex-1">
        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL を貼り付けて Enter（例: https://example.com/article）"
          className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
        />
      </div>
      <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
        <Sparkles size={12} className="text-blue-400" />
        AI 分類
      </span>
      <button
        type="submit"
        disabled={busy || !url.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-sm disabled:opacity-50"
      >
        <Plus size={18} />
        追加
      </button>
    </form>
  );
};
