# Reading List Manager

Chromeやその他のブラウザからエクスポートされたリーディングリスト（ブックマークHTMLファイル）を管理・閲覧するためのWebアプリケーションです。

## 機能

*   **インポート**: HTMLファイルをドラッグ＆ドロップで読み込み。
*   **検索**: タイトルやURLでリアルタイム検索。
*   **フィルタリング**: 追加日（Date Added）による期間指定フィルタ。
*   **ソート**: 追加日順、タイトル順での並び替え。

## 使い方

1.  アプリケーションを起動します。
    ```bash
    npm install
    npm run dev
    ```
2.  ブラウザで表示された画面（通常 `http://localhost:5173`）を開きます。
3.  中央のエリアに、ブラウザからエクスポートしたリーディングリストのHTMLファイルをドラッグ＆ドロップします。
4.  リストが表示されたら、上部のバーを使って検索や並び替えを行います。

## 技術スタック

*   React + TypeScript
*   Vite
*   Tailwind CSS
*   Lucide React (Icons)
*   date-fns (Date manipulation)