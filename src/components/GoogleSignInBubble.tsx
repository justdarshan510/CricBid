'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function GoogleSignInBubble() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [authError, setAuthError]     = useState('');
  const [loading, setLoading]         = useState(false);

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
      setAuthError(err.message || 'Google login failed');
    }
  };

  return (
    <>
      {/* ── FAB ── */}
      <div className="fixed bottom-5 left-5 z-50">
        {user ? (
          <button
            id="auth-avatar-btn"
            onClick={logout}
            title="Sign out"
            className="group relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200 shadow-md"
            style={{ borderColor: '#E7DFD1' }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold"
                style={{ background: '#2B2B2B', color: '#fff' }}
              >
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </button>
        ) : (
          <button
            id="auth-signin-btn"
            onClick={() => setIsModalOpen(true)}
            title="Sign In"
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ background: '#2B2B2B' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Auth Modal ── */}
      {isModalOpen && !user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(43,43,43,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-beige-panel w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent bar */}
            <div className="h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #C9A227, #E8C84A, #C9A227)' }} />
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
              style={{
                background: 'rgba(255,252,245,0.60)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#6B645D',
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black mb-1" style={{ color: '#2B2B2B', letterSpacing: '-0.02em' }}>
                Sign In
              </h2>
              <p className="text-sm mb-6" style={{ color: '#6B645D' }}>
                Sign in to save your progress and join multiplayer rooms.
              </p>

              {authError && (
                <div
                  className="mb-4 p-3 rounded-xl text-xs font-semibold text-center"
                  style={{ background: 'rgba(199,92,92,0.12)', border: '1px solid rgba(199,92,92,0.28)', color: '#C75C5C' }}
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="section-label block">Email</label>
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block">Password</label>
                  <input
                    id="auth-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    id="auth-login-btn"
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3 text-sm"
                  >
                    {loading ? 'Please wait…' : 'Login'}
                  </button>
                  <button
                    id="auth-register-btn"
                    type="button"
                    onClick={handleEmailRegister}
                    disabled={loading}
                    className="btn-secondary flex-1 py-3 text-sm"
                  >
                    Register
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.30)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9C9389' }}>
                  Or continue with
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.30)' }} />
              </div>

              {/* Google */}
              <button
                id="auth-google-btn"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-98"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.50)',
                  color: '#2B2B2B',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
