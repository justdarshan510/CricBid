'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isFadeOut, setIsFadeOut] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('cricbid_splash_shown');
    if (hasShown === 'true') { setShowSplash(false); return; }
    const t1 = setTimeout(() => setIsFadeOut(true), 4500);
    const t2 = setTimeout(() => { setShowSplash(false); sessionStorage.setItem('cricbid_splash_shown', 'true'); }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSkip = () => {
    setIsFadeOut(true);
    setTimeout(() => { setShowSplash(false); sessionStorage.setItem('cricbid_splash_shown', 'true'); }, 600);
  };

  const logoLetters = Array.from('CRICBID');

  return (
    <div className="relative">

      {/* ── Splash ── */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-center items-center overflow-hidden ${isFadeOut ? 'splash-fade-out' : ''}`}
          style={{ background: '#F5F0E8' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom animate-cinematic-reveal pointer-events-none"
            style={{ backgroundImage: "url('/front_bg.jpg')" }}
          />

          <button onClick={handleSkip}
            className="absolute top-6 right-6 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all duration-200"
            style={{ background: 'rgba(29,29,31,0.75)', backdropFilter: 'blur(16px)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.02em' }}
          >
            Skip
          </button>

          <div className="text-center z-10 select-none px-6">
            <div className="flex justify-center items-end space-x-0.5 md:space-x-1 mb-6">
              {logoLetters.map((char, i) => (
                <span
                  key={i}
                  className="splash-letter font-bold text-6xl md:text-9xl tracking-tight"
                  style={{
                    animationDelay: `${1.2 + i * 0.10}s`,
                    color: i >= 4 ? '#C8A24D' : '#1D1D1F',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="animate-subtitle-fade" style={{ animationDelay: '2.4s' }}>
              <p className="text-xs md:text-sm tracking-[0.25em] font-medium uppercase" style={{ color: '#6E6E73' }}>
                Bid · Draft · Dominate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Home ── */}
      <div className="min-h-[85vh] flex flex-col justify-center items-center py-20 px-4">

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto" style={{ marginBottom: '80px' }}>
          <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(200,162,77,0.12)', border: '1px solid rgba(200,162,77,0.25)', backdropFilter: 'blur(12px)' }}>
            <span className="live-dot" />
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: '#9A7430', letterSpacing: '0.08em' }}>
              Live Draft &amp; Auction Platform
            </span>
          </div>

          <h1 className="display-large mb-6">
            Build Your<br />
            <span style={{ color: '#C8A24D' }}>Dream Squad.</span>
          </h1>

          <p className="text-lg font-normal max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: '#6E6E73', fontWeight: 400 }}>
            Real-time multiplayer IPL-style auctions. Claim a franchise, bid strategically,
            and assemble a championship squad — all synced live.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              id="enter-auction-btn"
              onClick={() => router.push('/lobby')}
              className="btn-primary px-8 py-3.5 text-[15px]"
              style={{ borderRadius: '14px' }}
            >
              Enter Auction
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="btn-secondary px-8 py-3.5 text-[15px]"
              style={{ borderRadius: '14px' }}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Feature row */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: '💰',
              title: 'Budget Management',
              body: 'Every franchise enters with ₹120 Cr. All bids are verified and deducted in real time. Outbid rivals, but never overspend.',
            },
            {
              icon: '📋',
              title: 'Roster Rules',
              body: 'Build a squad of 12 to 25 players including a Wicketkeeper. Maximum 8 overseas stars per franchise.',
            },
            {
              icon: '⚡',
              title: 'Live Competition',
              body: 'Host a private room, invite friends with a 6-digit code, claim your franchise, and out-strategize rivals live.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass glass-hover p-7"
            >
              <span className="text-3xl mb-4 block">{card.icon}</span>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed font-normal" style={{ color: '#6E6E73' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
