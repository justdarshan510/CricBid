'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function GoogleSignInBubble() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      setIsModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    setAuthError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      setIsModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await loginWithGoogle();
      setIsModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Google Login failed');
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3">
        {user ? (
          <button
            onClick={logout}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 shadow-lg hover:ring-2 hover:ring-red-500 transition-all overflow-hidden border border-white/10"
            title="Sign out"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg hover:scale-105 transition-transform border border-slate-200"
            title="Sign In"
          >
            <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        )}
      </div>

      {isModalOpen && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card bg-[#0F172A]/90 border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-black uppercase text-white mb-6 text-center">Sign In</h2>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-[#94A3B8]/60 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#030810]/60 border border-white/5 focus:border-[#38BDF8] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/30 focus:outline-none transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-extrabold text-[#94A3B8]/60 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#030810]/60 border border-white/5 focus:border-[#38BDF8] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/30 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary btn-primary--highlight flex-1 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wait...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={handleEmailRegister}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 hover:bg-[#38BDF8]/20 transition active:scale-98 disabled:opacity-50"
                >
                  Register
                </button>
              </div>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-xs uppercase font-bold text-slate-500">Or continue with</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-slate-800 font-bold hover:bg-gray-100 transition shadow-sm active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
