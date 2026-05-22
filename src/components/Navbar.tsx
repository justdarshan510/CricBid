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

  const { userTeamId, teams, soundEnabled, toggleSound, resetAuction } = activeContext;
  const [isOpen, setIsOpen] = useState(false);

  const userTeam = teams.find(t => t.id === userTeamId);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'AI Arena', path: '/auction-room', disabled: !localAuction.userTeamId },
    { name: 'Multiplayer Lobby', path: '/lobby' },
    { name: 'Multiplayer Arena', path: '/multiplayer-room', disabled: !multiplayer.roomCode || !multiplayer.isAuctionStarted },
    { name: 'Team Dashboard', path: '/dashboard', disabled: !userTeamId },
    { name: 'Player Analytics', path: '/analytics' },
  ];

  return (
    <nav className="glass-card border-b border-slate-800/80 sticky top-0 z-50 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            IPL AUCTION SIM
          </span>
          <span className="text-xs uppercase bg-red-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
            LIVE
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            if (link.disabled) {
              return (
                <span
                  key={link.path}
                  className="text-slate-600 text-sm font-semibold cursor-not-allowed select-none"
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
                    ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1'
                    : 'text-slate-300 hover:text-white pb-1'
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
            <div className="flex items-center space-x-3 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: userTeam.color }}
              ></span>
              <span className="text-xs font-bold text-slate-300">{userTeam.shortName} Purse:</span>
              <span className="text-sm font-extrabold text-yellow-400">
                {userTeam.purse.toFixed(2)} Cr
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-xs font-semibold text-slate-400">
                {userTeam.players.length}/25 Squad
              </span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
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
              className="text-xs bg-red-950/80 hover:bg-red-900/90 text-red-400 font-bold px-3 py-2 rounded-lg border border-red-800/60 transition"
            >
              Reset Sim
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
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
            className="text-slate-300 hover:text-white focus:outline-none"
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
        <div className="md:hidden mt-4 pt-2 pb-1 border-t border-slate-800 flex flex-col space-y-3">
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
                    ? 'text-yellow-400 bg-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {userTeam && (
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-900 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{userTeam.name}</span>
              <span className="text-sm font-extrabold text-yellow-400">{userTeam.purse.toFixed(2)} Cr</span>
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
              className="w-full text-center text-xs bg-red-950/90 text-red-400 font-bold py-2 rounded border border-red-900/50"
            >
              Reset Simulation
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
