'use client';

import React from 'react';
import { useAuction, getNextBidAmount } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { BiddingEffectsOverlay } from './BiddingEffectsOverlay';

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
      <div className="glass p-12 text-center max-w-xl mx-auto shadow-md text-white">
        <h3 className="text-lg font-bold mb-1">No Player Under the Hammer</h3>
        <p className="text-sm text-white/60">The draft pool is empty or the auction is complete.</p>
      </div>
    );
  }

  const currentBidder = teams.find(t => t.id === currentBidderId);
  const userTeam = teams.find(t => t.id === userTeamId);

  const nextBidAmount = getNextBidAmount(
    currentBid,
    currentPlayer.base_price
  );

  const userHoldsBid = currentBidderId === userTeamId;
  const userHasBudget = userTeam ? userTeam.purse >= nextBidAmount : false;
  const userSquadFull = userTeam ? userTeam.players.length >= 25 : false;
  const userOverseasLimit = userTeam
    ? currentPlayer.overseas && userTeam.players.filter(p => p.overseas).length >= 8
    : false;

  const canUserBid =
    userTeam &&
    !userHoldsBid &&
    userHasBudget &&
    !userSquadFull &&
    !userOverseasLimit &&
    !isPaused &&
    auctionStatus === 'bidding';

  // Timer SVG configuration
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (timer / 20) * circumference;
  const timerUrgent = timer <= 5;

  /* Bid button label */
  const bidBtnLabel = !userTeamId ? 'Select a Franchise in Lobby to Bid'
    : userHoldsBid         ? '✓ You Hold High Bid'
    : userOverseasLimit    ? 'Overseas Limit Reached (Max 8)'
    : userSquadFull        ? 'Squad Full (Max 25)'
    : !userHasBudget && userTeam ? `Need ₹${nextBidAmount.toFixed(2)} Cr — Insufficient Purse`
    : isPaused             ? 'Auction is Paused'
    :                        `Place Bid — ₹${nextBidAmount.toFixed(2)} Cr`;

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative items-stretch">

        {/* LEFT: Player Card (Col 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="h-full flex flex-col justify-between">
            <h4 className="section-label mb-2">Active Player</h4>
            <PlayerCard player={currentPlayer} showBidOverlay={false} />
          </div>
        </div>

        {/* CENTER & RIGHT: Unified Command Center (Col 8) */}
        <div className="lg:col-span-8 flex flex-col">
          <h4 className="section-label mb-2">Auction Command Center</h4>
          <div className="glass p-6 grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow min-h-[420px] shadow-md">
            
            {/* Left Column: Bidding Controls (Col 7) */}
            <div className="md:col-span-7 flex flex-col justify-between">
              
              {/* Status & Timer */}
              <div className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="section-label block mb-0.5">Status</span>
                  <div className="flex items-center gap-1.5">
                    {!isPaused && <span className="live-dot" />}
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: isPaused ? '#FF453A' : '#30D158' }}
                    >
                      {isPaused ? 'Paused' : 'Live Bidding'}
                    </span>
                  </div>
                </div>

                {/* Countdown ring */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="36"
                      cy="36"
                      r={radius}
                      stroke={timerUrgent ? '#FF453A' : '#FFFFFF'}
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      className="transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    className={`absolute text-lg font-black ${timerUrgent ? 'timer-urgent' : ''}`}
                    style={{ color: timerUrgent ? '#FF453A' : '#FFFFFF' }}
                  >
                    {timer}
                  </span>
                </div>
              </div>

              {/* Price display */}
              <div className="text-center py-6 flex-grow flex flex-col justify-center">
                {currentBid === 0 ? (
                  <div className="space-y-1">
                    <span className="section-label block text-white/40">Base Draft Price</span>
                    <div className="text-5xl font-extrabold tracking-tight text-white">
                      ₹{currentPlayer.base_price.toFixed(2)}
                      <span className="text-xl font-semibold ml-1 text-white/60">Cr</span>
                    </div>
                    <p className="text-xs text-white/40 font-semibold">Awaiting the opening bid.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="section-label block text-white/40">Current Highest Bid</span>
                    <div className="text-5xl font-extrabold tracking-tight text-white">
                      ₹{currentBid.toFixed(2)}
                      <span className="text-xl font-semibold ml-1 text-white/60">Cr</span>
                    </div>
                    {currentBidder && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: currentBidder.color }} />
                        {currentBidder.logoUrl && (
                          <img
                            src={currentBidder.logoUrl}
                            alt={currentBidder.shortName}
                            className="w-5 h-5 object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="text-xs font-bold text-white">
                          {currentBidder.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={placeUserBid}
                  disabled={!canUserBid}
                  className={`w-full py-4 text-sm btn-primary ${
                    userHoldsBid ? 'bg-[#30D158] hover:bg-[#30D158] text-white shadow-none transform-none border-none' : ''
                  }`}
                  style={userHoldsBid ? { background: '#30D158', color: '#fff' } : undefined}
                >
                  {bidBtnLabel}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={isPaused ? resumeAuction : pauseAuction}
                    className="btn-secondary py-2 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </button>

                  <button
                    onClick={skipPlayer}
                    className="btn-secondary py-2 text-[10px] font-bold uppercase tracking-wider"
                  >
                    ✕ Pass
                  </button>

                  <button
                    onClick={autoSimulateActivePlayer}
                    className="btn-secondary py-2 text-[10px] font-bold uppercase tracking-wider"
                  >
                    ⚡ Fast Solve
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Bid Activity Log (Col 5) */}
            <div className="md:col-span-5 flex flex-col pl-6 border-t md:border-t-0 md:border-l border-[rgba(255,255,255,0.08)] pt-6 md:pt-0">
              <span className="section-label mb-3">Live Log Feed</span>
              <div
                className="flex flex-col-reverse gap-2 overflow-y-auto pr-1"
                style={{ height: '320px' }}
              >
                {logs.length === 0 ? (
                  <p className="text-xs text-center py-12 text-white/40 font-bold">
                    Activity will appear here.
                  </p>
                ) : (
                  logs.map((log, index) => {
                    let logClass = 'log-entry';
                    if (log.includes('SOLD!')) {
                      logClass = 'log-entry log-entry-sold';
                    } else if (log.includes('PASSED:') || log.includes('SKIPPED:')) {
                      logClass = 'log-entry log-entry-passed';
                    } else if (log.includes('Your Team') || log.includes('bids ')) {
                      logClass = 'log-entry log-entry-user';
                    }

                    return (
                      <div key={index} className={logClass}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* TEAMS PURSE OVERVIEW (Col 12) */}
        <div className="lg:col-span-12">
          <h4 className="section-label mb-3">Franchise Purse & Rosters</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {teams.map((t) => {
              const isUserTeam = t.id === userTeamId;
              return (
                <div
                  key={t.id}
                  className="glass p-3 relative overflow-hidden transition-all duration-200 hover:translate-y-[-1px] hover:shadow-sm"
                  style={{
                    borderLeft: `3px solid ${t.color}`,
                    background: isUserTeam ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      {t.shortName}
                      {isUserTeam && <span className="text-[10px]" title="Your Team">👤</span>}
                    </span>
                    <span className="text-[10px] font-bold text-white/60">
                      {t.players.length}/25
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">
                    ₹{t.purse.toFixed(2)} <span className="text-[10px] font-bold text-white/60">Cr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {(auctionStatus === 'sold_splash' || auctionStatus === 'unsold_splash') && (
        <BiddingEffectsOverlay
          status={auctionStatus === 'sold_splash' ? 'sold' : 'unsold'}
          playerName={
            auctionStatus === 'sold_splash' && lastWinner
              ? lastWinner.player.name
              : currentPlayer.name
          }
          playerRole={
            auctionStatus === 'sold_splash' && lastWinner
              ? lastWinner.player.role.replace('_', ' ')
              : currentPlayer.role.replace('_', ' ')
          }
          teamName={lastWinner?.team.name}
          teamLogoUrl={lastWinner?.team.logoUrl}
          teamColor={lastWinner?.team.color}
          amountStr={
            lastWinner
              ? `${lastWinner.price.toFixed(2)} Crore`
              : `${currentPlayer.base_price.toFixed(2)} Crore`
          }
          onClose={nextPlayer}
        />
      )}
    </div>
  );
};

export default LiveBiddingBoard;
