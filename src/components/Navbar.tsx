'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuction } from '../context/AuctionContext';
import { useMultiplayer } from '../context/MultiplayerContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const localAuction = useAuction();
  const multiplayer = useMultiplayer();
  const isMultiplayerActive = !!multiplayer.roomCode;
  const activeContext = isMultiplayerActive ? multiplayer : localAuction;
  const { userTeamId, teams, soundEnabled, voiceEnabled, toggleSound, toggleVoice, resetAuction } = activeContext;
  const [isOpen, setIsOpen] = useState(false);
  const userTeam = teams.find(t => t.id === userTeamId);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Lobby', path: '/lobby' },
    { name: 'Auction', path: '/multiplayer-room', disabled: !multiplayer.roomCode || !multiplayer.isAuctionStarted },
    { name: 'Dashboard', path: '/dashboard', disabled: !userTeamId },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8 w-full pointer-events-none">
      <nav
        className="w-full max-w-7xl mx-auto rounded-full pointer-events-auto"
        style={{
          background: 'rgba(28, 28, 30, 0.55)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between" style={{ height: '60px' }}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/cricbid-icon.svg" alt="CricBid" className="h-7 w-7 object-contain" />
            <span className="font-bold text-base tracking-tight select-none" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Cric<span style={{ color: '#C8A24D' }}>Bid</span>
            </span>
          </Link>

          {/* Center — floating pill nav */}
          <div className="hidden md:flex items-center">
            <div
              className="flex items-center gap-1 px-1.5 py-1.5 rounded-full"
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.20)',
              }}
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                if (link.disabled) {
                  return (
                    <span
                      key={link.path}
                      className="px-4 py-1.5 rounded-full text-[13px] font-semibold select-none cursor-not-allowed"
                      style={{ color: 'rgba(255, 255, 255, 0.25)' }}
                    >
                      {link.name}
                    </span>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200"
                    style={{
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                      boxShadow: isActive ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06)' : undefined,
                    }}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {userTeam && (
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: userTeam.color }} />
                <span className="font-semibold text-white/75">{userTeam.shortName}</span>
                <span className="font-bold text-[#FFFFFF]">₹{userTeam.purse.toFixed(2)} Cr</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>·</span>
                <span className="font-semibold text-white/45">{userTeam.players.length}/25</span>
              </div>
            )}

            {/* Voice */}
            <button
              id="nav-voice-toggle" onClick={toggleVoice}
              title={voiceEnabled ? 'Mute auctioneer' : 'Enable auctioneer'}
              className="btn-icon"
              style={{
                background: voiceEnabled ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 69, 58, 0.15)',
                borderColor: voiceEnabled ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 69, 58, 0.25)',
                color: voiceEnabled ? 'rgba(255, 255, 255, 0.75)' : '#FF453A',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                {voiceEnabled
                  ? <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  : <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />}
              </svg>
            </button>

            {/* Sound */}
            <button id="nav-sound-toggle" onClick={toggleSound} title={soundEnabled ? 'Mute' : 'Unmute'} className="btn-icon"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.10)',
                color: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                {soundEnabled
                  ? <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.414 4.243 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10c0-1.105-.447-2.103-1.172-2.828a1 1 0 010-1.414z" clipRule="evenodd" />
                  : <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />}
              </svg>
            </button>

            {userTeamId && (
              <button
                onClick={() => { if (confirm('Reset the auction? All draft progress will be lost.')) { resetAuction(); window.location.href = '/'; } }}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200"
                style={{ color: '#FF453A', background: 'rgba(255, 69, 58, 0.15)', border: '1px solid rgba(255, 69, 58, 0.25)' }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleVoice} className="btn-icon" style={{ color: voiceEnabled ? 'rgba(255,255,255,0.70)' : '#FF453A' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="btn-icon">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isOpen && (
          <div
            className="md:hidden border-t px-4 pt-3 pb-4 flex flex-col gap-1 rounded-3xl mt-1"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)', background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(20px)' }}
          >
            {navLinks.map((link) => {
              if (link.disabled) return null;
              const isActive = pathname === link.path;
              return (
                <Link key={link.path} href={link.path} onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold"
                  style={{ color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.70)', background: isActive ? 'rgba(255, 255, 255, 0.10)' : 'transparent' }}
                >
                  {link.name}
                </Link>
              );
            })}
            {userTeam && (
              <div className="mt-2 px-3 py-2 rounded-2xl flex justify-between text-sm" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.10)' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.70)' }}>{userTeam.name}</span>
                <span className="font-bold text-white">₹{userTeam.purse.toFixed(2)} Cr</span>
              </div>
            )}
            {userTeamId && (
              <button
                onClick={() => { if (confirm('Reset?')) { resetAuction(); window.location.href = '/'; } }}
                className="px-3 py-2 rounded-2xl text-xs font-bold text-left mt-1"
                style={{ color: '#FF453A', background: 'rgba(255, 69, 58, 0.15)' }}
              >
                Reset Simulation
              </button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};
