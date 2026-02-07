# Firebase Setup Guide

This guide will help you set up Firebase for the Reading List Manager application to enable cloud synchronization and multi-device access.

## Prerequisites

- A Google account
- Node.js and npm installed
- Basic familiarity with Firebase Console

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "reading-list-manager")
4. (Optional) Enable Google Analytics for your project
5. Click "Create project" and wait for it to be provisioned

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web** icon (</>) to add a web app
2. Enter an app nickname (e.g., "Reading List Web App")
3. Do **not** check "Also set up Firebase Hosting" (unless you want to deploy)
4. Click "Register app"
5. Copy the Firebase configuration object shown - you'll need this later

The configuration will look like this:
```javascript
{
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

## Step 3: Enable Firebase Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar
2. Click "Get started" if this is your first time
3. Go to the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle the **Enable** switch
6. Select a **Project support email** (your email)
7. Click **Save**

### Optional: Add Authorized Domains

If deploying to a custom domain:
1. Stay in the **Sign-in method** tab
2. Scroll to **Authorized domains**
3. Click "Add domain" and enter your domain
4. Click "Add"

## Step 4: Set Up Cloud Firestore

1. In the Firebase Console, go to **Firestore Database** from the left sidebar
2. Click "Create database"
3. Select a starting mode:
   - **Test mode**: Allows all reads/writes (easier for development, less secure)
   - **Production mode**: Denies all reads/writes by default (more secure)
   
   **Recommendation**: Start with test mode for development, then switch to production mode later

4. Choose a Firestore location (select one closest to your users)
5. Click "Enable"

### Configure Security Rules (Recommended)

After creating the database, set up security rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own bookmarks
    match /users/{userId}/bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny access to everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

These rules ensure:
- Users must be authenticated to access bookmarks
- Users can only access their own bookmarks
- No one can access other users' data

## Step 5: Configure Your Application

1. In your project root, copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor

3. Fill in the Firebase configuration values you copied in Step 2:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

4. Save the file

**Important**: Never commit the `.env` file to version control. It's already listed in `.gitignore`.

## Step 6: Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Click the "Sign In" button in the top right

4. Sign in with your Google account

5. If successful, you should see:
   - Your name/email in the header
   - A cloud sync icon
   - A "Sign Out" button

## Step 7: Deploy Security Rules (Production)

Before deploying to production, update your Firestore security rules:

1. Go to **Firestore Database** → **Rules** tab
2. Use the production-ready rules from Step 4
3. Test your rules using the Firebase Emulator Suite (optional but recommended)
4. Click "Publish"

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Add your domain to authorized domains:
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain (e.g., `localhost`, `yourdomain.com`)

### "Missing or insufficient permissions"

**Solution**: Check your Firestore security rules:
1. Ensure the user is authenticated
2. Verify the rules allow access to the correct paths
3. Check that the user ID in the path matches the authenticated user

### Sign-in popup is blocked

**Solution**: Allow popups for your development server:
1. Check your browser's popup blocker settings
2. Add an exception for `localhost:5173`

### Data not syncing

**Solution**: Check the browser console for errors:
1. Open Developer Tools (F12)
2. Check the Console tab for error messages
3. Verify your Firebase configuration is correct
4. Ensure you're signed in

## Data Structure

Your bookmarks are stored in Firestore with the following structure:

```
users/
  {userId}/
    bookmarks/
      {bookmarkId}/
        - title: string
        - url: string
        - addDate: number (Unix timestamp)
        - lastModified: number (Unix timestamp)
        - icon: string (optional)
        - tags: array (optional)
        - image: string (optional)
        - ogp: object (optional)
```

## Cost Considerations

Firebase offers a generous free tier:

### Free Tier Limits (Spark Plan)
- **Authentication**: Unlimited
- **Firestore Reads**: 50,000 per day
- **Firestore Writes**: 20,000 per day
- **Firestore Storage**: 1 GB

For most personal use cases, the free tier should be sufficient. If you exceed these limits, you'll need to upgrade to the Blaze (pay-as-you-go) plan.

## Next Steps

- Enable Firebase Hosting to deploy your app
- Set up Firebase Cloud Functions for advanced features
- Implement backup and export functionality
- Add social sharing features

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [React + Firebase Tutorial](https://firebase.google.com/docs/web/setup)
