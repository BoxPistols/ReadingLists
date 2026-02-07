# Reading List Manager

Chromeやその他のブラウザからエクスポートされたリーディングリスト（ブックマークHTMLファイル）を管理・閲覧するためのWebアプリケーションです。

## 機能

*   **インポート**: HTMLファイルをドラッグ＆ドロップで読み込み。
*   **検索**: タイトルやURLでリアルタイム検索。
*   **フィルタリング**: 追加日（Date Added）による期間指定フィルタ。
*   **ソート**: 追加日順、タイトル順での並び替え。
*   **クラウド同期**: Firebaseによる複数デバイス間でのブックマーク同期（オプション）
*   **認証**: Googleアカウントでのサインイン
*   **オフラインファースト**: ローカルデータベース（Dexie.js/IndexedDB）を使用し、オンライン時に自動同期

## 使い方

### 基本的な使い方（Firebase無し）

1.  アプリケーションを起動します。
    ```bash
    npm install
    npm run dev
    ```
2.  ブラウザで表示された画面（通常 `http://localhost:5173`）を開きます。
3.  中央のエリアに、ブラウザからエクスポートしたリーディングリストのHTMLファイルをドラッグ＆ドロップします。
4.  リストが表示されたら、上部のバーを使って検索や並び替えを行います。

### Firebase同期機能を使う場合

1.  Firebaseプロジェクトを作成します（[Firebase Console](https://console.firebase.google.com/)）
2.  Firebase Authentication を有効にし、Googleサインインプロバイダーを設定します
3.  Cloud Firestoreを有効にします
4.  `.env.example`をコピーして`.env`を作成します
    ```bash
    cp .env.example .env
    ```
5.  `.env`ファイルにFirebaseの設定情報を入力します
6.  アプリケーションを起動します
7.  ヘッダーの「Sign In」ボタンからGoogleアカウントでログインします
8.  ブックマークが自動的にクラウドと同期されます

## Firebase設定方法

### 1. Firebaseプロジェクトの作成

1.  [Firebase Console](https://console.firebase.google.com/)にアクセス
2.  「プロジェクトを追加」をクリック
3.  プロジェクト名を入力して作成

### 2. Authentication設定

1.  Firebaseコンソールで「Authentication」を選択
2.  「Sign-in method」タブを開く
3.  「Google」を有効にする

### 3. Firestore設定

1.  Firebaseコンソールで「Firestore Database」を選択
2.  「データベースを作成」をクリック
3.  テストモードまたは本番モードで開始（後でルールを設定可能）

### 4. Firebase設定情報の取得

1.  Firebaseコンソールで「プロジェクトの設定」（⚙️アイコン）を開く
2.  「全般」タブの「アプリ」セクションで Web アプリを追加
3.  表示される設定情報を`.env`ファイルに記入

## 技術スタック

*   React + TypeScript
*   Vite
*   Tailwind CSS
*   Lucide React (Icons)
*   date-fns (Date manipulation)
*   Dexie.js (IndexedDB wrapper)
*   Firebase (Authentication & Firestore)

## アーキテクチャ

### オフラインファースト戦略

このアプリケーションはオフラインファーストのアーキテクチャを採用しています：

1.  **ローカルストレージ**: すべてのブックマークはDexie.js（IndexedDB）にローカル保存されます
2.  **自動同期**: ユーザーがログインすると、ローカルとFirestoreのデータを自動的にマージします
3.  **リアルタイム更新**: Firestoreの変更をリアルタイムで検知し、ローカルデータベースに反映します
4.  **競合解決**: 同じURLのブックマークは、より新しいlastModifiedタイムスタンプを持つものを優先します

## プロジェクト構造

```
src/
├── components/        # Reactコンポーネント
├── contexts/         # React Context (AuthContext)
├── hooks/            # カスタムフック (useBookmarkSync)
├── services/         # Firebase/Firestoreサービス
├── utils/            # ユーティリティ関数
├── db.ts             # Dexieデータベース設定
├── firebase.ts       # Firebase初期化
├── firebase-config.ts # Firebase設定
└── types.ts          # TypeScript型定義
```