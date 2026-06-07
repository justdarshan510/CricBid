'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isFadeOut, setIsFadeOut] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('cricbid_splash_shown');
    if (hasShown === 'true') {
      setShowSplash(false);
      return;
    }

    const fadeOutTimer = setTimeout(() => setIsFadeOut(true), 4800);
    const endTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('cricbid_splash_shown', 'true');
    }, 5500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const handleSkip = () => {
    setIsFadeOut(true);
    setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('cricbid_splash_shown', 'true');
    }, 700);
  };

  const logoLetters = Array.from('CRICBID');

  return (
    <div className="relative">
      {/* ── Splash Screen ── */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-center items-center overflow-hidden ${
            isFadeOut ? 'splash-fade-out' : ''
          }`}
          style={{ background: '#F5EFE4' }}
        >
          {/* Subtle player image — very low opacity warm texture */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom animate-cinematic-reveal pointer-events-none"
            style={{ backgroundImage: "url('/front_bg.jpg')" }}
          />

          {/* Skip */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition duration-200 cursor-pointer"
            style={{ background: '#2B2B2B', color: '#fff', letterSpacing: '0.1em' }}
          >
            Skip ›
          </button>

          {/* Logo */}
          <div className="text-center z-10 select-none px-6">
            <div className="flex justify-center items-center space-x-1 md:space-x-2 mb-5">
              {logoLetters.map((char, index) => {
                const isBid = index >= 4;
                return (
                  <span
                    key={index}
                    className="splash-letter font-black tracking-tighter text-5xl md:text-8xl select-none"
                    style={{
                      animationDelay: `${1.4 + index * 0.11}s`,
                      color: isBid ? '#2B2B2B' : '#1E1E1E',
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

            <div
              className="animate-subtitle-fade"
              style={{ animationDelay: '2.6s' }}
            >
              <p
                className="text-xs md:text-sm uppercase tracking-[0.3em] font-bold"
                style={{ color: '#666666' }}
              >
                Bid · Draft · Dominate
              </p>
              <div
                className="w-12 h-px mx-auto mt-4"
                style={{ background: '#D4C9B8' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Home Screen ── */}
      <div className="min-h-[80vh] flex flex-col justify-center items-center py-16 px-4">

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          {/* Brand */}
          <div className="flex justify-center mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
              style={{
                color: '#2B2B2B',
                background: 'rgba(43,43,43,0.06)',
                border: '1px solid rgba(201,162,39,0.25)',
              }}
            >
              ⚡ Live Draft &amp; Auction Platform
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]"
            style={{ color: '#1E1E1E', letterSpacing: '-0.03em' }}
          >
            Build Your<br />
            <span style={{ color: '#2B2B2B' }}>Dream Squad.</span>
          </h1>

          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: '#666666' }}
          >
            Real-time multiplayer IPL auctions. Claim a franchise, bid strategically,
            and assemble a championship squad — all synced live with Firebase.
          </p>

          {/* CTA */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => router.push('/lobby')}
              id="enter-auction-btn"
              className="btn-primary px-8 py-3.5 text-sm font-semibold"
            >
              Enter Auction →
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div
          className="mt-20 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 px-2 pt-10"
          style={{ borderTop: '1px solid #E7DFD1' }}
        >
          {[
            {
              icon: '💰',
              title: 'Budget Caps',
              body: 'Every franchise enters the draft with exactly ₹120 Cr. All bids are verified and deducted in real time — no overspending.',
            },
            {
              icon: '📋',
              title: 'Roster Rules',
              body: 'Build a squad of 12 to 25 players including a designated Wicketkeeper. Maximum 8 overseas stars per franchise.',
            },
            {
              icon: '👥',
              title: 'Live Competition',
              body: 'Host a private room, invite friends with a 6-digit code, claim your franchise, and out-strategize rivals in the auction room.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-beige glass-hover p-6 space-y-2"
            >
              <span className="text-2xl">{card.icon}</span>
              <h3 className="font-bold text-sm" style={{ color: '#1E1E1E' }}>
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
