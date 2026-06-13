import { useState } from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// 匿名時は「Sign in to sync」、ログイン時はアカウントメニュー（サインアウト）を出す。
// ログインウォールは作らず、同期は任意の昇格として提示する。
export const AuthButton = () => {
  const { user, isAnonymous, signInWithGoogle, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Sign-in failed:', e);
      alert('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!user || isAnonymous) {
    return (
      <button
        onClick={handleSignIn}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold shadow-sm disabled:opacity-60"
        title="Sign in to sync across devices"
      >
        <LogIn size={18} />
        Sign in to sync
      </button>
    );
  }

  const label = user.displayName || user.email || 'Account';

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
        title={label}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <UserIcon size={18} />
          </span>
        )}
        <span className="hidden md:inline text-sm font-semibold text-gray-700 max-w-[140px] truncate">
          {label}
        </span>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || 'Signed in'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={async () => {
                setMenuOpen(false);
                await signOutUser();
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
