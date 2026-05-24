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
    { name: 'Multiplayer Lobby', path: '/lobby' },
    { name: 'Multiplayer Arena', path: '/multiplayer-room', disabled: !multiplayer.roomCode || !multiplayer.isAuctionStarted },
    { name: 'Team Dashboard', path: '/dashboard', disabled: !userTeamId },
    { name: 'Player Analytics', path: '/analytics' },
  ];

  return (
    <nav className="glass-card border-b border-white/5 bg-[#07111F]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <img src="/cric_bid_logo.png" alt="Cric Bid Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-extrabold text-[#38BDF8] tracking-wider font-display">CRIC BID</span>
          <span className="text-[10px] tracking-widest uppercase bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 font-extrabold px-2 py-0.5 rounded ml-2">STUDIO</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            if (link.disabled) {
              return (
                <span
                  key={link.path}
                  className="text-white/20 text-sm font-semibold cursor-not-allowed select-none"
                  title="Select a team on the Home Page first"
                >
                  {link.name}
                </span>
              );
            }
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-[#38BDF8] border-b-2 border-[#38BDF8] pb-1'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] pb-1'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Team Status & Action Controls */}
        <div className="hidden md:flex items-center space-x-4">
          {userTeam && (
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: userTeam.color }}
              ></span>
              <span className="text-xs font-bold text-[#94A3B8]">{userTeam.shortName} Purse:</span>
              <span className="text-sm font-extrabold text-[#38BDF8]">
                {userTeam.purse.toFixed(2)} Cr
              </span>
              <span className="text-[#94A3B8]">|</span>
              <span className="text-xs font-semibold text-[#94A3B8]">
                {userTeam.players.length}/25 Squad
              </span>
            </div>
          )}

          {/* Auctioneer voice toggle */}
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg border transition ${
              voiceEnabled
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-[#94A3B8] hover:text-[#F8FAFC]'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
            title={voiceEnabled ? 'Turn off auctioneer voice' : 'Turn on auctioneer voice'}
            aria-label={voiceEnabled ? 'Turn off auctioneer voice' : 'Turn on auctioneer voice'}
          >
            {voiceEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                <path d="M3.27 3L2 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 3.27 3z" />
              </svg>
            )}
          </button>

          {/* Sound effects toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[#94A3B8] hover:text-[#F8FAFC] transition"
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.414 4.243 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10c0-1.105-.447-2.103-1.172-2.828a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Reset Button */}
          {userTeamId && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset the auction? All draft progress will be lost.')) {
                  resetAuction();
                  window.location.href = '/';
                }
              }}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-2 rounded-lg border border-red-500/20 transition"
            >
              Reset Sim
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded border ${
              voiceEnabled
                ? 'bg-[#030810]/60 border-white/5 text-[#94A3B8]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={voiceEnabled ? 'Turn off auctioneer voice' : 'Turn on auctioneer voice'}
            aria-label={voiceEnabled ? 'Turn off auctioneer voice' : 'Turn on auctioneer voice'}
          >
            {voiceEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                <path d="M3.27 3L2 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 3.27 3z" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded bg-[#030810]/60 border border-white/5 text-[#94A3B8]"
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#94A3B8] hover:text-[#F8FAFC] focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-2 pb-1 border-t border-white/5 flex flex-col space-y-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            if (link.disabled) return null;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-semibold transition px-2 py-1 rounded ${
                  isActive
                    ? 'text-[#38BDF8] bg-white/5'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {userTeam && (
            <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#94A3B8]">{userTeam.name}</span>
              <span className="text-sm font-extrabold text-[#38BDF8]">{userTeam.purse.toFixed(2)} Cr</span>
            </div>
          )}

          {userTeamId && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset the auction?')) {
                  resetAuction();
                  window.location.href = '/';
                }
              }}
              className="w-full text-center text-xs bg-red-500/10 text-red-400 font-bold py-2 rounded border border-red-500/20"
            >
              Reset Simulation
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
