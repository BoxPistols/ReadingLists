import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const provider = new GoogleAuthProvider();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Anonymous-first: 未ログインなら即匿名サインインして「開いた瞬間使える」を担保する。
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        signInAnonymously(auth).catch((e) => {
          console.error('Anonymous sign-in failed:', e);
          setLoading(false);
        });
      }
    });
    return unsub;
  }, []);

  // 匿名ユーザーの既存データを引き継いだまま Google アカウントへ昇格する。
  const signInWithGoogle = async () => {
    const current = auth.currentUser;
    try {
      if (current?.isAnonymous) {
        await linkWithPopup(current, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      const err = e as { code?: string };
      // その Google アカウントに既存データがある場合は link できないので、そのアカウントへサインインし直す。
      if (err.code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(e as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
        if (credential) {
          await signInWithCredential(auth, credential);
          return;
        }
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return; // ユーザーが閉じただけ
      }
      throw e;
    }
  };

  // サインアウト後は onAuthStateChanged が null を受けて再び匿名サインインするのでアプリは使い続けられる。
  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
