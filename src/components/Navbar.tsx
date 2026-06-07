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

  const { userTeamId, teams, soundEnabled, voiceEnabled, toggleSound, toggleVoice, resetAuction } =
    activeContext;
  const [isOpen, setIsOpen] = useState(false);

  const userTeam = teams.find(t => t.id === userTeamId);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Lobby', path: '/lobby' },
    { name: 'Auction', path: '/multiplayer-room', disabled: !multiplayer.roomCode || !multiplayer.isAuctionStarted },
    { name: 'Dashboard', path: '/dashboard', disabled: !userTeamId },
    { name: 'Analytics', path: '/analytics' },
  ];

  const iconBtnBase: React.CSSProperties = {
    background: 'rgba(255,252,245,0.55)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.32)',
    borderRadius: '0.5rem',
    padding: '0.4rem',
    cursor: 'pointer',
    transition: 'background 0.15s ease, box-shadow 0.15s ease',
    color: '#6B645D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <nav className="navbar px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5">
          <img src="/cricbid-icon.svg" alt="CricBid" className="h-8 w-8 object-contain" />
          <span
            className="text-lg font-black tracking-tight select-none"
            style={{ color: '#2B2B2B', letterSpacing: '-0.02em' }}
          >
            Cric<span style={{ color: '#C9A227' }}>Bid</span>
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full hidden sm:inline-block"
            style={{
              background: 'rgba(201,162,39,0.12)',
              border: '1px solid rgba(201,162,39,0.28)',
              color: '#8B6914',
            }}
          >
            Beta
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            if (link.disabled) {
              return (
                <span
                  key={link.path}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg cursor-not-allowed select-none"
                  style={{ color: '#C4BDB5' }}
                >
                  {link.name}
                </span>
              );
            }
            return (
              <Link
                key={link.path}
                href={link.path}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150"
                style={{
                  color: isActive ? '#2B2B2B' : '#6B645D',
                  background: isActive
                    ? 'rgba(255,252,245,0.70)'
                    : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* Purse pill */}
          {userTeam && (
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: 'rgba(255,252,245,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.32)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: userTeam.color }} />
              <span className="font-medium" style={{ color: '#6B645D' }}>{userTeam.shortName}</span>
              <span className="font-bold" style={{ color: '#2B2B2B' }}>₹{userTeam.purse.toFixed(2)} Cr</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
              <span style={{ color: '#9C9389' }}>{userTeam.players.length}/25</span>
            </div>
          )}

          {/* Voice toggle */}
          <button
            id="nav-voice-toggle"
            onClick={toggleVoice}
            title={voiceEnabled ? 'Mute auctioneer' : 'Enable auctioneer'}
            aria-label={voiceEnabled ? 'Mute auctioneer' : 'Enable auctioneer'}
            style={{
              ...iconBtnBase,
              background: voiceEnabled
                ? 'rgba(255,252,245,0.55)'
                : 'rgba(199,92,92,0.12)',
              borderColor: voiceEnabled
                ? 'rgba(255,255,255,0.32)'
                : 'rgba(199,92,92,0.30)',
              color: voiceEnabled ? '#6B645D' : '#C75C5C',
            }}
          >
            {voiceEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                <path d="M3.27 3L2 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 3.27 3z" />
              </svg>
            )}
          </button>

          {/* Sound toggle */}
          <button
            id="nav-sound-toggle"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            style={iconBtnBase}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.414 4.243 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10c0-1.105-.447-2.103-1.172-2.828a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Reset */}
          {userTeamId && (
            <button
              onClick={() => {
                if (confirm('Reset the auction? All draft progress will be lost.')) {
                  resetAuction();
                  window.location.href = '/';
                }
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150"
              style={{
                color: '#C75C5C',
                background: 'rgba(199,92,92,0.10)',
                border: '1px solid rgba(199,92,92,0.25)',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button onClick={toggleVoice} style={{ ...iconBtnBase, color: voiceEnabled ? '#6B645D' : '#C75C5C' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg"
            style={{ color: '#6B645D' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="md:hidden mt-3 pt-3 pb-2 flex flex-col space-y-1 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.25)' }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            if (link.disabled) return null;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: isActive ? '#2B2B2B' : '#6B645D',
                  background: isActive ? 'rgba(255,252,245,0.65)' : 'transparent',
                }}
              >
                {link.name}
              </Link>
            );
          })}
          {userTeam && (
            <div
              className="px-3 py-2 rounded-lg flex items-center justify-between text-sm"
              style={{ background: 'rgba(255,252,245,0.55)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <span className="font-medium" style={{ color: '#6B645D' }}>{userTeam.name}</span>
              <span className="font-bold" style={{ color: '#2B2B2B' }}>₹{userTeam.purse.toFixed(2)} Cr</span>
            </div>
          )}
          {userTeamId && (
            <button
              onClick={() => { if (confirm('Reset?')) { resetAuction(); window.location.href = '/'; } }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-left"
              style={{ color: '#C75C5C', background: 'rgba(199,92,92,0.08)' }}
            >
              Reset Simulation
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
