# Roadmap: Server-side CRUD with Firebase

## Overview
Currently, bookmarks are stored locally in the browser's IndexedDB using Dexie.js. To enable multi-device synchronization and secure backups, we plan to integrate Firebase as a backend.

## Proposed Tasks

### 1. Firebase Setup
- [ ] Create a Firebase project and obtain configuration.
- [ ] Set up Firebase Authentication (Google Sign-In).
- [ ] Set up Cloud Firestore for data storage.

### 2. Implementation of Server CRUD
- [ ] Implement `src/firebase.ts` to initialize Firebase.
- [ ] Add `AuthContext` to manage user sessions.
- [ ] Synchronize Dexie data with Firestore:
  - **Strategy**: Offline-First. Use Dexie as a local cache and sync with Firestore when online.
  - **Schema**:
    - `users/{userId}/bookmarks/{bookmarkId}`

### 3. UI/UX Improvements
- [ ] Add a Login/Logout button in the header.
- [ ] Display a "Sync Status" indicator (Cloud icon).
- [ ] Handle conflict resolution between local and remote data.

## Implementation Details (Draft)

### Firebase Config Template
```typescript
// src/firebase-config.ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  // ...
};
```

### Sync Logic Pattern
Use `Dexie`'s synchronization hooks or a manual `useEffect` to push local changes to Firestore:
```typescript
db.bookmarks.hook('creating', (primKey, obj) => {
  if (isLoggedIn) {
    addDoc(collection(db, "bookmarks"), obj);
  }
});
```
