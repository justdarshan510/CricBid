'use client';
 
import React from 'react';
import { useMultiplayer } from '../context/MultiplayerContext';
import { getNextBidAmount } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { BiddingEffectsOverlay } from './BiddingEffectsOverlay';
export const MultiplayerLiveBiddingBoard: React.FC = () => {
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
    isHost,
    roomCode,
    clients,
    placeUserBid,
    skipPlayer,
    nextPlayer,
    pauseAuction,
    resumeAuction,
    playerName
  } = useMultiplayer();

  // Compute only teams that have been claimed by a player
  const claimedTeams = teams.filter(t => clients.some(c => c.teamId === t.id));

  if (!currentPlayer) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center border border-white/5 bg-[#07111F]/60">
        <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">No Player Under the Hammer</h3>
        <p className="text-sm text-[#94A3B8]">The draft pool is currently empty or the auction is complete.</p>
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
  
  const canUserBid = userTeam && !userHoldsBid && userHasBudget && !userSquadFull && !userOverseasLimit && !isPaused && auctionStatus === 'bidding';

  // Countdown timer circle calculations
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer / 10) * circumference;

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* LEFT: Player Card (Col Span 4) */}
      <div className="lg:col-span-4 flex flex-col justify-between">
        <div className="mb-4">
          <h4 className="text-xs uppercase tracking-widest font-extrabold text-[#94A3B8]/60 mb-2.5">
            Active Player
          </h4>
          <PlayerCard 
            player={currentPlayer} 
            showBidOverlay={false}
          />
        </div>
      </div>

      {/* CENTER: Bidding Dashboard & Controls (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="glass-card rounded-3xl p-6 border border-white/5 shadow-xl flex-grow flex flex-col justify-between relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#94A3B8]/60 tracking-wider">
                Status
              </span>
              <span className={`block text-xs font-black uppercase tracking-wider ${isPaused ? 'text-red-400' : 'text-emerald-300 animate-pulse'}`}>
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
                  stroke="rgba(255, 255, 255, 0.05)"
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
                <span className="text-xs uppercase tracking-widest text-[#94A3B8]/60 block">BASE DRAFT PRICE</span>
                <div className="text-4xl md:text-5xl font-black text-[#F8FAFC] drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  {currentPlayer.base_price.toFixed(2)} Cr
                </div>
                <p className="text-[11px] text-[#94A3B8] max-w-[80%] mx-auto">
                  Awaiting the opening bid to kick off the countdown.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#94A3B8]/60 block font-bold">CURRENT HIGHEST BID</span>
                <div className="text-5xl md:text-6xl font-black text-[#38BDF8] drop-shadow-[0_0_20px_rgba(56,189,248,0.25)] animate-pulse">
                  {currentBid.toFixed(2)} Cr
                </div>
                <div className="mt-2.5 flex items-center justify-center space-x-2">
                   {currentBidder?.logoUrl ? (
                     <img
                       src={currentBidder.logoUrl}
                       alt={currentBidder.shortName}
                       className="w-6 h-6 object-contain drop-shadow"
                       referrerPolicy="no-referrer"
                       onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                     />
                   ) : (
                     <span
                       className="w-2.5 h-2.5 rounded-full inline-block"
                       style={{ backgroundColor: currentBidder?.color }}
                     ></span>
                   )}
                   <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                     {currentBidder?.name} ({currentBidder?.shortName})
                   </span>
                 </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            {/* Bid button */}
            <button
              onClick={placeUserBid}
              disabled={!canUserBid}
              className={`w-full py-4 rounded-2xl text-base font-black uppercase tracking-wider transition-all duration-200 shadow-lg ${
                canUserBid
                  ? 'bg-gradient-to-r from-[#38BDF8] to-[#0284C7] text-[#07111F] hover:shadow-[0_4px_20px_rgba(56,189,248,0.3)] active:scale-98 cursor-pointer'
                  : 'bg-white/5 border border-white/5 text-[#94A3B8]/40 cursor-not-allowed'
              }`}
            >
              {!userTeamId
                ? 'Claim a Team in Lobby to Bid'
                : userHoldsBid
                ? 'You Hold High Bid'
                : userOverseasLimit
                ? 'Overseas Limit Reached (Max 8)'
                : userSquadFull
                ? 'Squad is Full (Max 25)'
                : !userHasBudget && userTeam
                ? `Need ${nextBidAmount.toFixed(2)} Cr (Insufficient Purse)`
                : isPaused
                ? 'Auction is Paused'
                : `Place Bid - ${nextBidAmount.toFixed(2)} Cr`}
            </button>

            {/* Quick Actions Panel - Host Only */}
            {isHost ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={isPaused ? resumeAuction : pauseAuction}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-bold hover:bg-white/10 transition cursor-pointer"
                >
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button
                  onClick={skipPlayer}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-bold hover:bg-white/10 transition cursor-pointer"
                >
                  ✖ Pass Player
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#030810]/40 border border-white/5 text-center text-[10px] text-[#94A3B8]/60 uppercase tracking-widest font-extrabold">
                🔒 Host ({clients.find(c => c.isHost)?.name}) controls auction flow
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Live Log Feed (Col Span 3) */}
      <div className="lg:col-span-3 flex flex-col justify-between">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-extrabold text-[#94A3B8]/60 mb-2.5">
            Bidding Activity Ticker
          </h4>
          <div className="glass-card rounded-2xl border border-white/5 p-4 h-96 overflow-y-auto flex flex-col-reverse space-y-3 space-y-reverse bg-[#07111F]/30">
            {logs.length === 0 ? (
              <p className="text-xs text-[#94A3B8]/40 text-center py-12">Bidding activity will appear here.</p>
            ) : (
              logs.map((log, index) => {
                const isSold = log.startsWith('SOLD!');
                const isPassed = log.startsWith('PASSED') || log.startsWith('SKIPPED');
                const isUser = log.includes(playerName) || (userTeam && log.includes(userTeam.shortName));
                return (
                  <div
                    key={index}
                    className={`text-xs p-2.5 rounded-xl border transition animate-fade-in ${
                      isSold
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-extrabold shadow shadow-emerald-500/5'
                        : isPassed
                        ? 'bg-white/5 border border-white/5 text-[#94A3B8]/60 font-semibold'
                        : isUser
                        ? 'bg-[#38BDF8]/10 border-[#38BDF8]/20 text-[#38BDF8] font-bold shadow shadow-[#38BDF8]/5'
                        : 'bg-white/2 border border-white/2 text-[#F8FAFC]'
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
        <h4 className="text-xs uppercase tracking-widest font-extrabold text-[#94A3B8]/60 mb-2.5 flex items-center justify-between">
          <span>Competitors Live Dashboard</span>
          <span className="text-[10px] text-[#38BDF8] font-bold uppercase tracking-wider bg-[#38BDF8]/10 px-2 py-0.5 border border-[#38BDF8]/20 rounded">
            Room Code: {roomCode}
          </span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {claimedTeams.map((t) => {
            const isCurrentBidder = t.id === currentBidderId;
            const isUser = t.id === userTeamId;
            const claimedBy = clients.find(c => c.teamId === t.id);

            return (
              <div
                key={t.id}
                className={`glass-card p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                  isCurrentBidder 
                    ? 'ring-1 scale-102 bg-[#07111F]/80 backdrop-blur-md' 
                    : 'bg-white/3'
                }`}
                style={{
                  boxShadow: isCurrentBidder ? `0 4px 15px ${t.color}25` : undefined,
                  borderWidth: '1.5px',
                  borderColor: isCurrentBidder ? t.color : 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {t.logoUrl ? (
                      <img
                        src={t.logoUrl}
                        alt={t.shortName}
                        className="w-8 h-8 object-contain flex-shrink-0 drop-shadow"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      ></span>
                    )}
                    <span className={`text-xs font-bold text-white uppercase truncate ${isUser ? 'underline decoration-[#38BDF8]' : ''}`} title={t.name}>
                      {t.shortName} {isUser ? '👤' : claimedBy ? '👥' : ''}
                    </span>
                  </div>
                  {isCurrentBidder && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse flex-shrink-0"
                      style={{ backgroundColor: t.color, color: '#000' }}
                    >
                      BID
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-[8px] text-[#94A3B8]/50 uppercase font-semibold">Purse Left</span>
                    <span className="text-xs font-black text-[#F8FAFC]">{t.purse.toFixed(2)} Cr</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-[#94A3B8]/50 uppercase font-semibold">Squad</span>
                    <span className="text-xs font-bold text-[#94A3B8]">{t.players.length}/25</span>
                  </div>
                </div>
                
                {claimedBy && (
                  <div className="mt-1 border-t border-white/5 pt-1 text-[8px] text-[#94A3B8]/40 uppercase truncate">
                    Manager: {claimedBy.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SOLD / UNSOLD BANNER MODAL SPLASH */}
      {(auctionStatus === 'sold_splash' || auctionStatus === 'unsold_splash') && (
        <BiddingEffectsOverlay
          status={auctionStatus === 'sold_splash' ? 'sold' : 'unsold'}
          playerName={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.player.name : currentPlayer.name}
          playerRole={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.player.role.replace('_', ' ') : currentPlayer.role.replace('_', ' ')}
          teamName={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.name : undefined}
          teamLogoUrl={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.logoUrl : undefined}
          teamColor={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.color : undefined}
          amountStr={auctionStatus === 'sold_splash' && lastWinner ? `${lastWinner.price.toFixed(2)} Crore` : `${currentPlayer.base_price.toFixed(2)} Crore`}
          onClose={nextPlayer}
        />
      )}
      </div>
    </div>
  );
};
