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
      <div className="glass p-12 text-center max-w-xl mx-auto">
        <h3 className="text-lg font-bold mb-1" style={{ color: '#1D1D1F' }}>No Player Under the Hammer</h3>
        <p className="text-sm" style={{ color: '#6E6E73' }}>The draft pool is empty or the auction is complete.</p>
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
  const bidBtnLabel = !userTeamId ? 'Select a Franchise to Begin Bidding'
    : userHoldsBid         ? '✓ You Hold High Bid'
    : userOverseasLimit    ? 'Overseas Limit Reached (Max 8)'
    : userSquadFull        ? 'Squad Full (Max 25)'
    : !userHasBudget && userTeam ? `Need ₹${nextBidAmount.toFixed(2)} Cr — Insufficient Purse`
    : isPaused             ? 'Auction is Paused'
    :                        `Place Bid — ₹${nextBidAmount.toFixed(2)} Cr`;

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

        {/* LEFT: Player Card (Col 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="section-label mb-2">Active Player</h4>
            <PlayerCard player={currentPlayer} showBidOverlay={false} />
          </div>
        </div>

        {/* CENTER: Bidding Panel (Col 5) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass p-6 flex flex-col justify-between flex-grow min-h-[420px]">
            
            {/* Status & Timer */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="section-label block mb-0.5">Status</span>
                <div className="flex items-center gap-1.5">
                  {!isPaused && <span className="live-dot" />}
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: isPaused ? '#FF453A' : '#32D74B' }}
                  >
                    {isPaused ? 'Paused' : 'Live Bidding'}
                  </span>
                </div>
              </div>

              {/* Countdown ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    stroke={timerUrgent ? '#FF453A' : '#1D1D1F'}
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
                  style={{ color: timerUrgent ? '#FF453A' : '#1D1D1F' }}
                >
                  {timer}
                </span>
              </div>
            </div>

            {/* Price display */}
            <div className="text-center py-6 flex-grow flex flex-col justify-center">
              {currentBid === 0 ? (
                <div className="space-y-1">
                  <span className="section-label block">Base Draft Price</span>
                  <div className="text-5xl font-bold tracking-tight text-[#1D1D1F]">
                    ₹{currentPlayer.base_price.toFixed(2)}
                    <span className="text-xl font-semibold ml-1 text-[#6E6E73]">Cr</span>
                  </div>
                  <p className="text-xs text-[#6E6E73]">Awaiting the opening bid.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="section-label block">Current Highest Bid</span>
                  <div className="text-5xl font-bold tracking-tight text-[#1D1D1F]">
                    ₹{currentBid.toFixed(2)}
                    <span className="text-xl font-semibold ml-1 text-[#6E6E73]">Cr</span>
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
                      <span className="text-xs font-semibold text-[#1D1D1F]">
                        {currentBidder.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <button
                onClick={placeUserBid}
                disabled={!canUserBid}
                className={`w-full py-4 text-sm btn-primary ${
                  userHoldsBid ? 'bg-[#32D74B] hover:bg-[#32D74B] text-white shadow-none transform-none' : ''
                }`}
                style={userHoldsBid ? { background: '#32D74B', color: '#fff' } : undefined}
              >
                {bidBtnLabel}
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={isPaused ? resumeAuction : pauseAuction}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>

                <button
                  onClick={skipPlayer}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  ✕ Pass
                </button>

                <button
                  onClick={autoSimulateActivePlayer}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  ⚡ Fast Solve
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT: Activity Log (Col 3) */}
        <div className="lg:col-span-3 flex flex-col">
          <h4 className="section-label mb-2">Bid Activity</h4>
          <div
            className="glass p-3 flex flex-col-reverse gap-2 overflow-y-auto"
            style={{ height: '420px' }}
          >
            {logs.length === 0 ? (
              <p className="text-xs text-center py-12 text-[#9A9AA0]">
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
                    background: isUserTeam ? 'rgba(255, 255, 255, 0.25)' : undefined
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-[#1D1D1F] flex items-center gap-1">
                      {t.shortName}
                      {isUserTeam && <span className="text-[10px]" title="Your Team">👤</span>}
                    </span>
                    <span className="text-[10px] font-medium text-[#6E6E73]">
                      {t.players.length}/25
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#1D1D1F]">
                    ₹{t.purse.toFixed(2)} <span className="text-[10px] font-semibold text-[#6E6E73]">Cr</span>
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
