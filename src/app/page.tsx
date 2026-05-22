'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '../context/AuctionContext';
import { CSVUploader } from '../components/CSVUploader';

export default function HomePage() {
  const router = useRouter();
  const {
    teams,
    userTeamId,
    selectUserTeam,
    startAuction,
    players,
    isAuctionStarted,
    resetAuction
  } = useAuction();

  const [csvUploadedMsg, setCsvUploadedMsg] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === userTeamId);

  const handleStartSim = () => {
    if (!userTeamId) return;
    if (!isAuctionStarted) {
      startAuction();
    }
    router.push('/auction-room');
  };

  const handleCSVSuccess = () => {
    setCsvUploadedMsg('Roster sheet imported successfully! Select your team below.');
    setTimeout(() => setCsvUploadedMsg(null), 5000);
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs uppercase tracking-widest font-black text-yellow-400 bg-yellow-950/60 border border-yellow-800/80 px-3.5 py-1.5 rounded-full inline-block">
          🏏 IPLLive Live Draft
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          AI-POWERED IPL <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            AUCTION SIMULATOR
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
          Manage a franchise, set budgets, upload custom player sheets, and bid live against 9 smart AI opponent teams. Optimize your Playing XI in real time.
        </p>
      </div>

      {/* Game Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Play Solo vs AI */}
        <div 
          onClick={() => {
            document.getElementById('franchise-selector')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="glass-card p-6 rounded-3xl border border-slate-800/80 hover:border-yellow-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 text-center space-y-3"
        >
          <span className="text-3xl block">🤖</span>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Play vs AI</h3>
          <p className="text-xs text-slate-400">
            Bid against 9 smart AI managers. Upload custom CSV lists. Fully offline-friendly.
          </p>
          <span className="text-xs text-yellow-400 font-extrabold uppercase tracking-wider block pt-2">
            Configure AI Game Below ↓
          </span>
        </div>

        {/* Play Multiplayer */}
        <div 
          onClick={() => router.push('/lobby')}
          className="glass-card p-6 rounded-3xl border border-slate-800/80 hover:border-orange-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 text-center space-y-3 bg-gradient-to-br from-slate-950/40 to-orange-950/10"
        >
          <span className="text-3xl block">👥</span>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Play with Friends</h3>
          <p className="text-xs text-slate-400">
            Create or join a room using a code. Bid against your friends live in real-time.
          </p>
          <span className="text-xs text-orange-400 font-extrabold uppercase tracking-wider block pt-2">
            Enter Lobby & Create Room →
          </span>
        </div>
      </div>

      {/* Roster database upload */}
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <span>📂</span>
            <span>Seed Custom Player Rosters (Optional)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload custom CSV files for openers, spinners, death bowlers, finishers, and all-rounders to override the default auction draft pool.
          </p>
          <CSVUploader onUploadSuccess={handleCSVSuccess} />
          {csvUploadedMsg && (
            <div className="mt-3 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 p-2.5 rounded-xl text-center">
              {csvUploadedMsg}
            </div>
          )}
        </div>
      </div>

      {/* Franchise Selection Section */}
      <div id="franchise-selector" className="space-y-6 scroll-mt-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            Select Your IPL Franchise (AI Mode)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a franchise to manage. The AI will command the remaining 9 teams during the live bidding war.
          </p>
        </div>

        {/* Teams grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {teams.map((t) => {
            const isSelected = t.id === userTeamId;
            return (
              <div
                key={t.id}
                onClick={() => selectUserTeam(t.id)}
                className={`glass-card p-5 rounded-2xl border text-center cursor-pointer transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-opacity-50 scale-102 bg-slate-900/90'
                    : 'bg-slate-950/40 hover:bg-slate-900/40 hover:-translate-y-1'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${t.color}30` : undefined,
                  borderWidth: '1.5px',
                  borderColor: isSelected ? t.color : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Visual indicator lines */}
                <div
                  className="absolute top-0 inset-x-0 h-1"
                  style={{ backgroundColor: t.color }}
                ></div>

                {/* Initial Jersey Shield logo mock */}
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-lg font-black shadow-inner mb-4 relative"
                  style={{
                    backgroundColor: `${t.color}15`,
                    border: `1.5px solid ${t.color}40`,
                    color: t.color
                  }}
                >
                  {t.shortName}
                </div>

                <div>
                  <h3 className="text-xs font-black text-white group-hover:text-yellow-400 transition-colors uppercase leading-none truncate">
                    {t.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mt-1.5">
                    120.0 Cr Purse
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 text-xs bg-yellow-400 text-slate-950 font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Simulator CTA */}
      <div className="text-center pt-4">
        {selectedTeam ? (
          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={handleStartSim}
              className="w-full py-4 rounded-2xl text-base font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 shadow-xl shadow-yellow-500/10 transition hover:shadow-yellow-500/20 active:scale-98 animate-pulse"
            >
              Enter Live Auction Room →
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Managing franchise: <span className="font-bold text-slate-300">{selectedTeam.name}</span>
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 max-w-sm mx-auto text-xs text-slate-500 uppercase tracking-wider font-bold">
            Select a team above to enter the simulator
          </div>
        )}
      </div>

      {/* Bottom Rules summary */}
      <div className="max-w-4xl mx-auto border-t border-slate-900 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/30 border border-slate-900">
          <span className="block font-black text-slate-200 uppercase tracking-wider">💰 Budget Caps</span>
          <p>Each franchise begins the live draft room with exactly 120.0 Cr of total purse headroom. All bids are automatically subtracted.</p>
        </div>
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/30 border border-slate-900">
          <span className="block font-black text-slate-200 uppercase tracking-wider">📋 Roster Rules</span>
          <p>Teams must construct a squad containing between 12 and 25 players, including a Wicketkeeper and a maximum of 8 overseas stars.</p>
        </div>
        <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/30 border border-slate-900">
          <span className="block font-black text-slate-200 uppercase tracking-wider">🦾 Bidding AI</span>
          <p>Compete against simulated franchises that adjust bid values dynamically depending on their rosters, role balance, and remaining budgets.</p>
        </div>
      </div>
    </div>
  );
}
