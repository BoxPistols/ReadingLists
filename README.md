# Reading List Manager

URL を貼り付けてブックマークし、**AI が自動分類**する Web アプリケーションです。**Firebase によるマルチデバイス同期**に対応しています。

## 機能

*   **URL ブックマーカー**: URL を貼り付けるだけで登録。主役の入力フロー。
*   **AI 自動分類**: 追加時に Cloud Function がページを取得し、Claude が単一カテゴリ + タグを自動付与（手動修正可）。
*   **OGP 自動取得**: サムネイル・説明文・タイトルをサーバー側で取得して保存。
*   **HTML 一括インポート**（副次機能）: Chrome 等からエクスポートしたブックマーク HTML を取り込み。
*   **検索**: タイトルやURLでリアルタイム検索（AND検索）。
*   **フィルタリング**: カテゴリ・タグ・追加日（期間）での絞り込み。
*   **ソート**: 追加日順、タイトル順での並び替え。
*   **編集 / 削除**: カードの編集ボタンからタイトル・URL・カテゴリ・タグを編集、単体削除。
*   **クラウド同期**: Firebase Auth + Firestore で全端末リアルタイム同期。オフライン編集も自動同期。

## アーキテクチャ

```
[Client React]  URL を貼って追加
  Firestore SDK (persistentLocalCache)  ← onSnapshot リアルタイム + オフライン書込
        │  add bookmark {url}
        ▼
[Firestore]  users/{uid}/bookmarks/{id}
        │  onDocumentCreated
        ▼
[Cloud Function enrichBookmark]
   1. ページ取得 → OGP/タイトル/サムネイルを抽出
   2. Claude (claude-opus-4-8) が単一カテゴリ + タグを分類
   3. doc に書き戻し
        ▼  (全端末に push)
```

- **認証**: Anonymous-first（開いた瞬間に匿名サインイン）→ 任意で Google アカウントへ昇格（匿名データを引き継ぎ）。ログインウォールなし。
- **データ層**: `src/repo/bookmarksRepo.ts` が Firestore CRUD を抽象化。UI は同期実装を意識しない。
- **同期状態**: ヘッダーのクラウドアイコンが `synced / syncing / offline` を表示。

## セットアップ

### 1. Firebase プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成。
2. **Authentication** を有効化し、ログインプロバイダで **匿名** と **Google** をオンにする。
3. **Cloud Firestore** を作成（本番モード）。
4. **プロジェクト設定 > マイアプリ** で Web アプリを登録し、表示される config をコピー。

### 2. 環境変数
```bash
cp .env.example .env
# .env に Firebase config の値を記入
```

### 3. ローカル起動
```bash
npm install
npm run dev          # http://localhost:5173
```

### 4. AI 分類用の API キー（Cloud Function 用）
Claude による自動分類には Anthropic API キーが必要です（[console](https://console.anthropic.com/) で取得）。
```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# プロンプトにキーを貼り付け
```

### 5. デプロイ
```bash
npm i -g firebase-tools         # 未インストールの場合
firebase login
firebase use --add              # 作成したプロジェクトを選択（.firebaserc を更新）

# セキュリティルール + Functions + Hosting を一括デプロイ
npm run deploy                  # = npm run build && firebase deploy
```

> **Cloud Functions について**: OGP 取得 + AI 分類（`functions/`）は Functions v2 を使うため **Blaze（従量）プラン**が必要です。個人利用の規模なら Function/Firestore は無料枠内で実質 \$0、Claude API は分類1件あたり数百トークン程度。未デプロイでもアプリ本体（追加・同期・編集）は動作します（OGP・分類が埋まらないだけ）。
>
> 分類のコストを抑えたい場合は `functions/src/index.ts` の `model: 'claude-opus-4-8'` を `'claude-haiku-4-5'` に変更すると入出力コストが約5分の1になります。

### エミュレータ（ローカル検証）
```bash
npm run emulators    # Auth / Firestore / Functions / Hosting をローカル起動
```

## 技術スタック

*   React 19 + TypeScript
*   Vite 7
*   Tailwind CSS v4
*   Firebase (Auth, Firestore offline cache, Cloud Functions v2)
*   Lucide React (Icons) / date-fns
