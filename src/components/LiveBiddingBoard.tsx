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
    : userHoldsBid         ? '● You Hold High Bid'
    : userOverseasLimit    ? 'Overseas Limit Reached (Max 8)'
    : userSquadFull        ? 'Squad Full (Max 25)'
    : !userHasBudget && userTeam ? `Need ₹${nextBidAmount.toFixed(2)} Cr — Insufficient Purse`
    : isPaused             ? 'Auction is Paused'
    :                        `Place Bid — ₹${nextBidAmount.toFixed(2)} Cr`;

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative items-stretch">

        {/* LEFT: Player Card (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="h-full flex flex-col justify-between">
            <h4 className="section-label mb-2">Active Player</h4>
            <PlayerCard player={currentPlayer} showBidOverlay={false} />
          </div>
        </div>

        {/* RIGHT: Unified Command Center (Col 7) */}
        <div className="lg:col-span-7 flex flex-col">
          <h4 className="section-label mb-2">Auction Command Center</h4>
          <div className="glass p-6 flex flex-col justify-between flex-grow min-h-[420px] shadow-md">
            
            {/* Status & Timer */}
            <div className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.08)]">
              <div>
                <span className="section-label block mb-0.5">Status</span>
                <div className="flex items-center gap-1.5">
                  {!isPaused && <span className="live-dot" style={{ background: '#C8A96E', boxShadow: '0 0 6px rgba(200, 169, 110, 0.35)' }} />}
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: isPaused ? 'rgba(200, 185, 160, 0.65)' : '#C8A96E' }}
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
                    stroke={timerUrgent ? '#C8955A' : '#FFFFFF'}
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
                  style={{ color: timerUrgent ? '#C8955A' : '#FFFFFF' }}
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
                  userHoldsBid ? 'shadow-none transform-none border-none' : ''
                }`}
                style={userHoldsBid ? { background: '#2B8246', color: '#FFFFFF', opacity: 1, cursor: 'default' } : undefined}
              >
                {bidBtnLabel}
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={isPaused ? resumeAuction : pauseAuction}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-full"
                  style={{ borderRadius: '9999px' }}
                >
                  {isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  )}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={skipPlayer}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-full"
                  style={{ borderRadius: '9999px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 4v16l11-8-11-8z M19 5v14h-2V5h2z"/>
                  </svg>
                  Pass
                </button>

                <button
                  onClick={autoSimulateActivePlayer}
                  className="btn-secondary py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-full"
                  style={{ borderRadius: '9999px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Fast
                </button>
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
