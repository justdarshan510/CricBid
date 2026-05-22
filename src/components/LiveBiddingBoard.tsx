'use client';

import React from 'react';
import { useAuction, getNextBidAmount } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';

export const LiveBiddingBoard: React.FC = () => {
  const {
    currentPlayer,
    currentBid,
    currentBidderId,
    timer,
    isPaused,
    userTeamId,
    teams,
    logs,
    auctionStatus,
    lastWinner,
    placeUserBid,
    skipPlayer,
    nextPlayer,
    pauseAuction,
    resumeAuction,
    autoSimulateActivePlayer
  } = useAuction();

  if (!currentPlayer) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center border border-slate-800">
        <h3 className="text-xl font-bold text-slate-400 mb-2">No Player Under the Hammer</h3>
        <p className="text-sm text-slate-500">The draft pool is currently empty or the auction is complete.</p>
      </div>
    );
  }

  const currentBidder = teams.find(t => t.id === currentBidderId);
  const userTeam = teams.find(t => t.id === userTeamId);
  
  const nextBidAmount = getNextBidAmount(currentBid, currentPlayer.base_price);
  
  // Checking user bid eligibility
  const userHoldsBid = currentBidderId === userTeamId;
  const userHasBudget = userTeam ? userTeam.purse >= nextBidAmount : false;
  const userSquadFull = userTeam ? userTeam.players.length >= 25 : false;
  const userOverseasLimit = userTeam ? (currentPlayer.overseas && userTeam.players.filter(p => p.overseas).length >= 8) : false;
  
  const canUserBid = userTeam && !userHoldsBid && userHasBudget && !userSquadFull && !userOverseasLimit && !isPaused;

  // Countdown timer circle calculations
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer / 10) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* LEFT: Player Card (Col Span 4) */}
      <div className="lg:col-span-4 flex flex-col justify-between">
        <div className="mb-4">
          <h4 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-2.5">
            Active Player
          </h4>
          <PlayerCard 
            player={currentPlayer} 
            showBidOverlay={auctionStatus === 'bidding' && currentBid > 0}
            bidAmount={currentBid}
            bidderName={currentBidder?.shortName}
            bidderColor={currentBidder?.color}
          />
        </div>
      </div>

      {/* CENTER: Bidding Dashboard & Controls (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl flex-grow flex flex-col justify-between relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Status
              </span>
              <span className={`block text-xs font-black uppercase tracking-wider ${isPaused ? 'text-red-500' : 'text-emerald-400 animate-pulse'}`}>
                {isPaused ? 'Paused' : 'LIVE BIDDING'}
              </span>
            </div>

            {/* Countdown timer */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={timer <= 3 ? '#ef4123' : '#e5b80b'}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className={`absolute text-lg font-black ${timer <= 3 ? 'text-red-500 animate-ping' : 'text-white'}`}>
                {timer}
              </span>
            </div>
          </div>

          {/* Bid Display */}
          <div className="text-center py-6 flex-grow flex flex-col justify-center">
            {currentBid === 0 ? (
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-slate-500 block">BASE DRAFT PRICE</span>
                <div className="text-4xl md:text-5xl font-black text-slate-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  {currentPlayer.base_price.toFixed(2)} Cr
                </div>
                <p className="text-[11px] text-slate-400 max-w-[80%] mx-auto">
                  Awaiting the opening bid to kick off the countdown.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-slate-400 block font-bold">CURRENT HIGHEST BID</span>
                <div className="text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.25)] animate-pulse">
                  {currentBid.toFixed(2)} Cr
                </div>
                <div className="mt-2.5 flex items-center justify-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: currentBidder?.color }}
                  ></span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {currentBidder?.name} ({currentBidder?.shortName})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            {/* Bid button */}
            <button
              onClick={placeUserBid}
              disabled={!canUserBid}
              className={`w-full py-4 rounded-2xl text-base font-black uppercase tracking-wider transition-all duration-200 shadow-lg ${
                canUserBid
                  ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 text-slate-950 hover:shadow-yellow-500/20 active:scale-98'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {userHoldsBid
                ? 'You Hold High Bid'
                : userOverseasLimit
                ? 'Overseas Limit Reached (Max 8)'
                : userSquadFull
                ? 'Squad is Full (Max 25)'
                : !userHasBudget && userTeam
                ? `Need ${nextBidAmount.toFixed(2)} Cr (Insufficient Purse)`
                : isPaused
                ? 'Resume to Bid'
                : `Place Bid - ${nextBidAmount.toFixed(2)} Cr`}
            </button>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={isPaused ? resumeAuction : pauseAuction}
                className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                onClick={skipPlayer}
                className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                ✖ Pass Player
              </button>
              <button
                onClick={autoSimulateActivePlayer}
                className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold hover:bg-slate-800 transition"
                title="Fast forward bidding war by AI"
              >
                ⚡ Fast Solve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Log Feed (Col Span 3) */}
      <div className="lg:col-span-3 flex flex-col justify-between">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-2.5">
            Bidding Activity Ticker
          </h4>
          <div className="glass-card rounded-2xl border border-slate-800/80 p-4 h-96 overflow-y-auto flex flex-col-reverse space-y-3 space-y-reverse">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-12">Bidding activity will appear here.</p>
            ) : (
              logs.map((log, index) => {
                const isSold = log.startsWith('SOLD!');
                const isPassed = log.startsWith('PASSED') || log.startsWith('SKIPPED');
                const isUser = log.includes('Your Team');
                return (
                  <div
                    key={index}
                    className={`text-xs p-2.5 rounded-xl border transition animate-fade-in ${
                      isSold
                        ? 'bg-emerald-950/70 border-emerald-800/50 text-emerald-300 font-extrabold shadow shadow-emerald-500/10'
                        : isPassed
                        ? 'bg-slate-900 border-slate-800 text-slate-500 font-semibold'
                        : isUser
                        ? 'bg-yellow-950/70 border-yellow-800/50 text-yellow-300 font-bold shadow shadow-yellow-500/10'
                        : 'bg-slate-950/60 border-slate-900 text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM WIDE: Interactive Competitors Bidding Panel */}
      <div className="lg:col-span-12">
        <h4 className="text-xs uppercase tracking-widest font-extrabold text-slate-500 mb-2.5">
          Competitors Live Dashboard
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {teams.map((t) => {
            const isCurrentBidder = t.id === currentBidderId;
            const isUser = t.id === userTeamId;
            return (
              <div
                key={t.id}
                className={`glass-card p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                  isCurrentBidder 
                    ? 'ring-2 ring-opacity-50 scale-102 bg-slate-900/90' 
                    : 'bg-slate-950/60'
                }`}
                style={{
                  boxShadow: isCurrentBidder ? `0 0 15px ${t.color}30` : undefined,
                  borderWidth: '1.5px',
                  borderColor: isCurrentBidder ? t.color : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    ></span>
                    <span className={`text-xs font-bold text-white uppercase ${isUser ? 'underline decoration-yellow-400' : ''}`}>
                      {t.shortName} {isUser && '👤'}
                    </span>
                  </div>
                  {isCurrentBidder && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse"
                      style={{ backgroundColor: t.color, color: '#000' }}
                    >
                      BID
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-[8px] text-slate-500 uppercase">Purse Left</span>
                    <span className="text-xs font-black text-slate-300">{t.purse.toFixed(2)} Cr</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-500 uppercase">Squad</span>
                    <span className="text-xs font-bold text-slate-400">{t.players.length}/25</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOLD / UNSOLD BANNER MODAL SPLASH */}
      {(auctionStatus === 'sold_splash' || auctionStatus === 'unsold_splash') && (
        <div className="absolute inset-0 bg-slate-950/95 rounded-3xl z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in border border-slate-800">
          <div className="max-w-md w-full p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500"></div>
            
            {auctionStatus === 'sold_splash' && lastWinner ? (
              <>
                <div className="w-20 h-20 rounded-full mx-auto bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
                  🔨
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-800/80 px-2.5 py-1 bg-emerald-950/60 rounded-md">
                  PLAYER SOLD!
                </span>
                
                <h2 className="text-2xl font-black text-white mt-4 mb-1">
                  {lastWinner.player.name}
                </h2>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">
                  {lastWinner.player.role.replace('_', ' ')} | {lastWinner.player.nationality}
                </p>

                <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                  <div className="text-left border-r border-slate-900 pr-4">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Sold To</span>
                    <span
                      className="text-lg font-black uppercase"
                      style={{ color: lastWinner.team.color }}
                    >
                      {lastWinner.team.name}
                    </span>
                  </div>
                  <div className="text-right pl-4">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Winning Price</span>
                    <span className="text-xl font-black text-yellow-400">
                      {lastWinner.price.toFixed(2)} Cr
                    </span>
                  </div>
                </div>

                <button
                  onClick={nextPlayer}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-black uppercase tracking-wider transition active:scale-98 shadow-lg shadow-emerald-500/10"
                >
                  Continue Auction →
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full mx-auto bg-red-950 border-2 border-red-500/60 flex items-center justify-center text-4xl shadow-lg shadow-red-500/20 mb-4 animate-pulse">
                  🚫
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-800/80 px-2.5 py-1 bg-red-950/60 rounded-md">
                  PLAYER UNSOLD
                </span>
                
                <h2 className="text-2xl font-black text-white mt-4 mb-1">
                  {currentPlayer.name}
                </h2>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">
                  {currentPlayer.role.replace('_', ' ')} | {currentPlayer.nationality}
                </p>

                <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 mb-6">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Opening Bid was</span>
                  <span className="text-lg font-black text-slate-400">
                    {currentPlayer.base_price.toFixed(2)} Cr
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    No teams placed a bid. Player will enter the unsold draft pool.
                  </p>
                </div>

                <button
                  onClick={nextPlayer}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-slate-950 text-sm font-black uppercase tracking-wider transition active:scale-98 shadow-lg shadow-red-500/10"
                >
                  Continue Auction →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default LiveBiddingBoard;
