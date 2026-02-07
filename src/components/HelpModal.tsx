import React from 'react';
import { X, FileJson, BookOpen, Download } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">User Guide</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-600">
              <FileJson size={20} />
              1. Export from Chrome
            </h3>
            <div className="pl-7 text-gray-600 space-y-2">
              <p>まず、ブラウザからブックマークまたはリーディングリストをエクスポートします：</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Chromeの<b>ブックマークマネージャ</b>を開きます（Mac: <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Cmd+Opt+B</kbd>, Win: <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl+Shift+O</kbd>）。</li>
                <li>右上のメニュー（⋮）をクリックします。</li>
                <li><b>ブックマークをエクスポート</b>を選択します。</li>
                <li>HTMLファイルを保存します。</li>
              </ol>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-600">
              <BookOpen size={20} />
              2. Manage & Organize
            </h3>
            <div className="pl-7 text-gray-600 space-y-2">
              <p>ファイルをこのアプリにドラッグ＆ドロップすると、以下のことができます：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><b>検索:</b> タイトルやURLでリアルタイムに絞り込み。</li>
                <li><b>期間フィルタ:</b> 追加日でフィルタリング（例：先月追加した記事だけ表示）。</li>
                <li><b>タグ付け:</b> 各カードの「+ Tag」ボタンでタグを追加・管理できます。</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-blue-600">
              <Download size={20} />
              3. Export Changes
            </h3>
            <div className="pl-7 text-gray-600">
              <p className="text-sm">タグ付けや整理が終わったら、画面右上の<b>Export HTML</b>ボタンを押してください。タグ情報を含んだ新しいHTMLファイルがダウンロードされます。これをバックアップとして保存したり、このアプリで再度読み込んだりできます。</p>
            </div>
          </section>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            理解しました
          </button>
        </div>
      </div>
    </div>
  );
};
