'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isFadeOut, setIsFadeOut] = useState(false);
  const [particles, setParticles] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 30 }).map((_, i) => {
      const size = Math.random() * 3 + 2;
      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${Math.random() * 6 + 6}s`,
          animationDelay: `${Math.random() * 4}s`,
        }
      };
    });
    setParticles(newParticles);

    // Check session storage to see if splash has run in the current session
    const hasShown = sessionStorage.getItem('cricbid_splash_shown');
    if (hasShown === 'true') {
      setShowSplash(false);
      return;
    }

    // Auto trigger fade out after 5.8 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsFadeOut(true);
    }, 5800);

    // Completely remove splash screen after 6.6 seconds
    const endTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('cricbid_splash_shown', 'true');
    }, 6600);

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
    }, 800);
  };

  const logoLetters = Array.from('CRICBID');

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center">
      {/* Animated Splash Screen Overlay */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-50 bg-[#07111F] flex flex-col justify-center items-center overflow-hidden transition-all ${
            isFadeOut ? 'splash-fade-out' : ''
          }`}
        >
          {/* Animated Background Player Image (Cinematic Reveal & Zoom) */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom animate-cinematic-reveal"
            style={{ backgroundImage: "url('/front_bg.jpg')" }}
          />

          {/* Luxury Vignettes & Shading Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-[#07111F]/30 to-[#07111F]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#07111F_95%)] pointer-events-none" />

          {/* Floating Atmosphere Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <div
                key={p.id}
                className="float-particle"
                style={p.style}
              />
            ))}
          </div>

          {/* Soft Diagonal Light Streak Sweep */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-20">
            <div className="absolute w-[40%] h-[300%] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent transform -rotate-45 -translate-x-[150%] animate-light-streak" />
          </div>

          {/* Premium Skip Action Button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-full transition duration-300 z-50 cursor-pointer shadow-2xl"
          >
            Skip Intro ➔
          </button>

          {/* Splash Logo & Text Center Box */}
          <div className="text-center z-10 select-none px-6">
            <div className="flex justify-center items-center space-x-1.5 md:space-x-3 mb-4">
              {logoLetters.map((char, index) => {
                const isBid = index >= 4; // 'CRIC' is indices 0,1,2,3; 'BID' is 4,5,6
                return (
                  <span
                    key={index}
                    className={`splash-letter font-black tracking-tight text-5xl md:text-8xl select-none ${
                      isBid ? 'gold-sweep-text' : 'text-[#F8FAFC]'
                    }`}
                    style={{
                      animationDelay: `${1.8 + index * 0.12}s`,
                      textShadow: isBid ? undefined : '0 10px 40px rgba(248, 250, 252, 0.12)'
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Subtitle */}
            <div 
              className="animate-subtitle-fade"
              style={{ animationDelay: '3.1s' }}
            >
              <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#38BDF8] font-black">
                Build Your Dream Squad
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8]/50 to-transparent mx-auto mt-4 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* --- Home Screen Layout --- */}
      {/* Background Player Artwork with Deep Matte Vignette */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none -z-10"
        style={{ backgroundImage: "url('/front_bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111F] via-transparent to-[#07111F] -z-10 pointer-events-none" />

      {/* Main Home Screen Hero Container */}
      <div className="space-y-12 py-12 flex flex-col justify-center items-center min-h-[70vh] w-full px-4 animate-[subtitle-fade-in_1s_ease-out_forwards]">
        {/* Hero Header */}
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="text-4xl md:text-5xl font-black tracking-tighter select-none font-sans uppercase">
              <span className="text-[#F8FAFC]">CRIC</span>
              <span className="text-[#D4AF37]">BID</span>
            </div>
          </div>
          <span className="text-xs tracking-widest font-semibold text-[#D4AF37] px-4 py-2 inline-block">
            Live Draft & Auction Studio
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-[#F8FAFC]">
            Build Your Legacy
          </h1>
          <p className="text-base md:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-medium">
            Live auctions with intelligent squad building. <br className="hidden md:inline" />
            Compete with friends, draft strategically, and create your championship franchise.
          </p>
        </div>

        {/* Main CTA */}
        <div className="w-full max-w-md mx-auto text-center space-y-4 pt-6">
          <button
            onClick={() => router.push('/lobby')}
            className="btn-primary btn-primary--highlight w-full py-4 text-sm font-semibold tracking-wide cursor-pointer"
          >
            Enter Auction
          </button>
        </div>

        {/* Interactive Rules & Info Dashboard */}
        <div className="max-w-4xl w-full mx-auto border-t border-white/5 pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#94A3B8] px-4">
          <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#38BDF8]/20 transition duration-300">
            <span className="block font-black text-[#F8FAFC] uppercase tracking-wider text-sm flex items-center space-x-1.5">
              <span>💰</span> <span>Budget Caps</span>
            </span>
            <p className="text-[#94A3B8]/70 leading-relaxed font-medium">
              Every franchise begins the draft room with exactly 120.0 Cr of total purse headroom. All bids are verified and updated in real-time.
            </p>
          </div>
          <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#38BDF8]/20 transition duration-300">
            <span className="block font-black text-[#F8FAFC] uppercase tracking-wider text-sm flex items-center space-x-1.5">
              <span>📋</span> <span>Roster Rules</span>
            </span>
            <p className="text-[#94A3B8]/70 leading-relaxed font-medium">
              Franchises must draft between 12 and 25 players, including a designated Wicketkeeper and a maximum limit of 8 overseas stars.
            </p>
          </div>
          <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#38BDF8]/20 transition duration-300">
            <span className="block font-black text-[#F8FAFC] uppercase tracking-wider text-sm flex items-center space-x-1.5">
              <span>👥</span> <span>Live Competition</span>
            </span>
            <p className="text-[#94A3B8]/70 leading-relaxed font-medium">
              Host private rooms for your friends. Claim your favorite franchise, bid actively, and out-strategize real players in the auction room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
