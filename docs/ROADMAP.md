# Firebase Integration — Done

ローカル IndexedDB(Dexie) からの脱却とマルチデバイス同期を Firebase で実装済み。

## 実装済み

### 認証
- [x] Anonymous-first：起動時に匿名サインインし「開いた瞬間使える」を担保（`src/auth/AuthContext.tsx`）
- [x] Google Sign-In への昇格：`linkWithPopup` で匿名データを引き継ぎ。既存アカウント衝突時は `signInWithCredential` でフォールバック
- [x] ヘッダーのサインインボタン / アカウントメニュー（`src/components/AuthButton.tsx`）

### データ層
- [x] Dexie を廃止し Firestore に移行。`persistentLocalCache` + `persistentMultipleTabManager` でオフライン永続化（`src/firebase.ts`）
- [x] CRUD を `src/repo/bookmarksRepo.ts` に抽象化（UI は同期実装を意識しない）
- [x] スキーマ：`users/{uid}/bookmarks/{bookmarkId}`
- [x] `onSnapshot` リアルタイム購読フック（`src/hooks/useBookmarks.ts`）
- [x] 一括インポートは 500 件ごとに `writeBatch` 分割。再インポート時は URL で重複排除

### UI/UX
- [x] 同期インジケータ（`src/components/SyncIndicator.tsx`）：`hasPendingWrites`/`fromCache` から `synced/syncing/offline` を導出
- [x] 編集・単体削除モーダルを配線（`src/components/EditModal.tsx`）
- [x] 衝突解決は Firestore のオフラインキャッシュに委譲（自前実装なし）

### OGP（サーバー側エンリッチメント）
- [x] `functions/src/index.ts` の `enrichBookmark`（`onDocumentCreated`）が追加時に1回だけ OGP を取得し doc に書き戻し
- [x] favicon は Google `s2/favicons` を `<img>` 直参照（プロキシ廃止）
- [x] 旧 `server.js`（Express プロキシ）と client 側 `ogp.ts` を削除

### インフラ
- [x] `firestore.rules`：`users/{uid}` 配下は本人のみ read/write
- [x] `firebase.json`（Firestore / Functions / Hosting / Emulators）、`.firebaserc`

## 設計判断メモ

- **手動 Dexie⇄Firestore 同期は採用しなかった**。当初案の `db.bookmarks.hook('creating', ...)` で push する方式は、リモート pull でも発火して無限ループ・二重書き込みを起こし、衝突解決を自前で書く必要がある。Firestore のネイティブ・オフラインキャッシュに寄せることでこの一群を消した。
- **OGP は読み取り毎ではなく書き込み時に1回**。旧設計（クライアントが描画毎にプロキシを叩く）を、Cloud Function で1回取得→Firestore 永続化に置換。読み取り時プロキシ不要・全端末共有。
- **Functions v2 は Blaze プラン必須**。未デプロイでも UI は壊れない（OGP が埋まらないだけ）設計にしてある。

## 残タスク（任意）
- [ ] バンドル分割（firebase で ~660kB。`manualChunks` で vendor 分離）
- [ ] エミュレータ接続スイッチ（`connectFirestoreEmulator` を dev 環境で有効化）
- [ ] 実機での E2E 動作確認（要 Firebase config）
