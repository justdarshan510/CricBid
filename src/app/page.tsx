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
          style={{ background: '#121214' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom animate-cinematic-reveal pointer-events-none"
            style={{ backgroundImage: "url('/front_bg.png')" }}
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
                    color: '#FFFFFF',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="animate-subtitle-fade" style={{ animationDelay: '2.4s' }}>
              <p className="text-xs md:text-sm tracking-[0.25em] font-medium uppercase" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Bid · Draft · Dominate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Home ── */}
      <div className="min-h-[85vh] flex flex-col justify-center items-center py-20 px-4 text-white relative">

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto" style={{ marginBottom: '80px' }}>
          <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)' }}>
            <span className="live-dot" />
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
              Live Draft &amp; Auction Platform
            </span>
          </div>

          <div className="inline-flex items-center gap-[48px] text-center xl:text-left max-w-full mb-6">
            {/* Floating Cricket Gear Showcase Visual */}
            <img 
              src="/cricket_gear.png?v=14" 
              alt="Cricket Gear" 
              className="pointer-events-none select-none animate-fade-in hidden xl:block" 
              style={{ 
                height: '270px',
                width: 'auto',
                filter: 'brightness(1.15) contrast(1.05) saturate(1.10) drop-shadow(0 24px 40px rgba(212,150,58,0.20)) drop-shadow(0 8px 16px rgba(0,0,0,0.40))',
                imageRendering: '-webkit-optimize-contrast' as any
              }} 
            />

            <h1 className="display-large text-center xl:text-left tracking-tighter"
                style={{
                  color: 'rgba(255, 255, 255, 0.35)',
                  textShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                }}>
              Build Your<br />
              <span>Dream Squad</span>
            </h1>
          </div>

          <p className="text-lg font-normal max-w-lg mx-auto mb-10 leading-relaxed" 
             style={{ 
               fontWeight: 400,
               color: 'rgba(255, 255, 255, 0.70)',
               mixBlendMode: 'overlay' as any
             }}>
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


      </div>
    </div>
  );
}
