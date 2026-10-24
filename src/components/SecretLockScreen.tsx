import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';

interface SecretLockScreenProps {
  onUnlock: () => void;
}

export const SecretLockScreen: React.FC<SecretLockScreenProps> = ({ onUnlock }) => {
  const [clickCount, setClickCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set fake document title to match 404 page
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '404 Not Found';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // When modal opens, focus the password input
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // Handle clicking the word "found"
  const handleFoundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 15) {
      setIsModalOpen(true);
      setClickCount(0);
      setErrorMessage('');
      setPassword('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'classwael2401131%%') {
      onUnlock();
    } else {
      setErrorMessage('كلمة المنصة غلط');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setPassword('');
    setErrorMessage('');
    setClickCount(0);
  };

  return (
    <main 
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-neutral-800 select-none overflow-hidden" 
      dir="ltr"
    >
      {/* Realistic, plain 404 error page */}
      <div className="max-w-lg w-full text-center flex flex-col items-center justify-center">
        {/* 404 header */}
        <h1 className="text-7xl sm:text-9xl font-bold tracking-tight text-neutral-800 font-mono mb-2">
          404
        </h1>

        {/* not found line with completely disguised secret click handler on "found" */}
        <p className="text-xl sm:text-2xl font-mono text-neutral-600 mb-6">
          not{' '}
          <span
            onClick={handleFoundClick}
            className="cursor-default select-none outline-none focus:outline-none"
            role="presentation"
            tabIndex={-1}
          >
            found
          </span>
        </p>

        {/* Meaningless technical/server English filler text */}
        <div className="max-w-md text-xs sm:text-sm text-neutral-400 space-y-2.5 font-mono text-center leading-relaxed border-t border-neutral-100 pt-6">
          <p>The requested URL /default/session was not found on this server.</p>
          <p>Resource route handler returned a null payload for origin endpoint 0x404.</p>
          <p className="text-[11px] text-neutral-300 pt-1">
            Apache/2.4.52 (Ubuntu) Server at 127.0.0.1 Port 80 &bull; ERR_CONNECTION_CLOSED
          </p>
        </div>
      </div>

      {/* Secret Password Modal (Only appears after clicking "found" 15 times) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  تسجيل الدخول للمنصة
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  أدخل كلمة المرور الخاصة بالمعلم للمتابعة
                </p>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="اكتب كلمة المرور هنا..."
                    dir="ltr"
                    className="w-full px-4 py-3 text-base font-mono rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-shake">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-base shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>دخول المنصة</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
