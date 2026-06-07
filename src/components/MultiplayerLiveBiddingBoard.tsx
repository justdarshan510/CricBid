'use client';
 
import React from 'react';
import { useMultiplayer } from '../context/MultiplayerContext';
import { getNextBidAmount } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { BiddingEffectsOverlay } from './BiddingEffectsOverlay';

/* Shared inline style helpers */
const glassPanel: React.CSSProperties = {
  background: 'rgba(243,238,230,0.72)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 12px rgba(0,0,0,0.08)',
  borderRadius: '1.5rem',
};

const glassLight: React.CSSProperties = {
  background: 'rgba(243,238,230,0.60)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.26)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
  borderRadius: '1.25rem',
};

const glassChip: React.CSSProperties = {
  background: 'rgba(255,252,245,0.55)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.30)',
  borderRadius: '0.625rem',
};

export const MultiplayerLiveBiddingBoard: React.FC = () => {
  const {
    currentPlayer, currentBid, currentBidderId, timer, isPaused,
    userTeamId, teams, logs, auctionStatus, lastWinner,
    isHost, roomCode, clients,
    placeUserBid, skipPlayer, nextPlayer, sellNow,
    pauseAuction, resumeAuction, playerName, error,
  } = useMultiplayer();

  const claimedTeams = teams.filter(t => clients.some(c => c.teamId === t.id));

  if (!currentPlayer) {
    return (
      <div style={{ ...glassPanel, padding: '3rem', textAlign: 'center' }}>
        <h3 className="text-lg font-bold mb-1" style={{ color: '#2B2B2B' }}>No Player Under the Hammer</h3>
        <p className="text-sm" style={{ color: '#6B645D' }}>The draft pool is empty or the auction is complete.</p>
      </div>
    );
  }

  const currentBidder    = teams.find(t => t.id === currentBidderId);
  const userTeam         = teams.find(t => t.id === userTeamId);
  const nextBidAmount    = getNextBidAmount(currentBid, currentPlayer.base_price);

  const userHoldsBid      = currentBidderId === userTeamId;
  const userHasBudget     = userTeam ? userTeam.purse >= nextBidAmount : false;
  const userSquadFull     = userTeam ? userTeam.players.length >= 25 : false;
  const userOverseasLimit = userTeam
    ? currentPlayer.overseas && userTeam.players.filter(p => p.overseas).length >= 8
    : false;
  const canUserBid =
    userTeam && !userHoldsBid && userHasBudget && !userSquadFull &&
    !userOverseasLimit && !isPaused && auctionStatus === 'bidding';

  /* Timer ring */
  const radius       = 28;
  const circumference= 2 * Math.PI * radius;
  const strokeOffset = circumference - (timer / 20) * circumference;
  const timerUrgent  = timer <= 5;

  /* Bid button label */
  const bidBtnLabel = !userTeamId ? 'Claim a Team in Lobby to Bid'
    : userHoldsBid         ? '✓ You Hold the High Bid'
    : userOverseasLimit    ? 'Overseas Limit Reached (Max 8)'
    : userSquadFull        ? 'Squad Full (Max 25)'
    : !userHasBudget && userTeam ? `Need ₹${nextBidAmount.toFixed(2)} Cr — Insufficient Purse`
    : isPaused             ? 'Auction is Paused'
    :                        `Place Bid — ₹${nextBidAmount.toFixed(2)} Cr`;

  return (
    <div className="flex flex-col space-y-5">
      {error && (
        <div
          className="text-xs font-semibold p-3 rounded-xl text-center"
          style={{ background: 'rgba(199,92,92,0.12)', border: '1px solid rgba(199,92,92,0.28)', color: '#C75C5C' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative">

        {/* ── LEFT: Player Card (col 4) ── */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="section-label mb-2">Active Player</h4>
            <PlayerCard player={currentPlayer} showBidOverlay={false} />
          </div>
        </div>

        {/* ── CENTER: Bidding Dashboard (col 5) ── */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div style={{ ...glassPanel, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, minHeight: '420px' }}>

            {/* Status + Timer */}
            <div
              className="flex justify-between items-center pb-4 mb-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}
            >
              <div>
                <span className="section-label block mb-0.5">Status</span>
                <div className="flex items-center gap-1.5">
                  {!isPaused && <span className="live-dot" />}
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: isPaused ? '#C75C5C' : '#5E9F73' }}
                  >
                    {isPaused ? 'Paused' : 'Live Bidding'}
                  </span>
                </div>
              </div>

              {/* Countdown ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.25)" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="36" cy="36" r={radius}
                    stroke={timerUrgent ? '#C75C5C' : '#C9A227'}
                    strokeWidth="4" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={`absolute text-lg font-black ${timerUrgent ? 'timer-urgent' : ''}`}
                  style={{ color: timerUrgent ? '#C75C5C' : '#2B2B2B' }}
                >
                  {timer}
                </span>
              </div>
            </div>

            {/* Bid display */}
            <div className="text-center py-6 flex-grow flex flex-col justify-center">
              {currentBid === 0 ? (
                <div className="space-y-2">
                  <span className="section-label block">Base Draft Price</span>
                  <div className="text-5xl md:text-6xl font-black" style={{ color: '#2B2B2B', letterSpacing: '-0.04em' }}>
                    ₹{currentPlayer.base_price.toFixed(2)}
                    <span className="text-xl font-semibold ml-1" style={{ color: '#9C9389' }}>Cr</span>
                  </div>
                  <p className="text-xs" style={{ color: '#9C9389' }}>Awaiting the opening bid.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="section-label block">Current Highest Bid</span>
                  <div className="text-5xl md:text-6xl font-black" style={{ color: '#2B2B2B', letterSpacing: '-0.04em' }}>
                    ₹{currentBid.toFixed(2)}
                    <span className="text-xl font-semibold ml-1" style={{ color: '#9C9389' }}>Cr</span>
                  </div>
                  {currentBidder && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: currentBidder.color }} />
                      {currentBidder.logoUrl && (
                        <img src={currentBidder.logoUrl} alt={currentBidder.shortName}
                          className="w-5 h-5 object-contain" referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="text-xs font-semibold" style={{ color: '#2B2B2B' }}>
                        {currentBidder.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
              <button
                id="place-bid-btn"
                onClick={placeUserBid}
                disabled={!canUserBid}
                className="btn-primary w-full py-4 text-sm"
                style={userHoldsBid ? { background: '#5E9F73' } : undefined}
              >
                {bidBtnLabel}
              </button>

              {isHost ? (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'btn-pause-resume', label: isPaused ? '▶ Resume' : '⏸ Pause', action: isPaused ? resumeAuction : pauseAuction },
                    { id: 'btn-pass',         label: '✕ Pass',                           action: skipPlayer },
                    { id: 'btn-sell-now',     label: '🔨 Sell',                          action: sellNow },
                  ].map(ctrl => (
                    <button
                      key={ctrl.id}
                      id={ctrl.id}
                      onClick={ctrl.action}
                      className="py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200 hover:shadow-md"
                      style={{
                        ...glassChip,
                        color: '#2B2B2B',
                        cursor: 'pointer',
                      }}
                    >
                      {ctrl.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="p-3 rounded-xl text-center text-[10px] font-medium"
                  style={{ ...glassChip, color: '#9C9389' }}
                >
                  🔒 {clients.find(c => c.isHost)?.name || 'Host'} controls auction flow
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Bid Activity Log (col 3) ── */}
        <div className="lg:col-span-3 flex flex-col">
          <h4 className="section-label mb-2">Bid Activity</h4>
          <div
            style={{
              ...glassLight,
              padding: '0.75rem',
              height: '420px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: '0.5rem',
            }}
          >
            {logs.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: '#C4BDB5' }}>
                Activity will appear here.
              </p>
            ) : (
              logs.map((log, i) => {
                const isSold   = log.startsWith('SOLD!');
                const isPassed = log.startsWith('PASSED') || log.startsWith('SKIPPED');
                const isUserLog= log.includes(playerName) || (userTeam && log.includes(userTeam.shortName));
                const cls = isSold ? 'log-entry log-entry-sold'
                  : isPassed     ? 'log-entry log-entry-passed'
                  : isUserLog    ? 'log-entry log-entry-user'
                  :                'log-entry';
                return <div key={i} className={cls}>{log}</div>;
              })
            )}
          </div>
        </div>

        {/* ── BOTTOM: Competitors (full width) ── */}
        <div className="lg:col-span-12">
          <div className="flex items-center justify-between mb-3">
            <h4 className="section-label">Live Competitor Dashboard</h4>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ ...glassChip, color: '#6B645D' }}
            >
              Room · {roomCode}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {claimedTeams.map((t) => {
              const isCurrentBidder = t.id === currentBidderId;
              const isUser          = t.id === userTeamId;
              const claimedBy       = clients.find(c => c.teamId === t.id);

              return (
                <div
                  key={t.id}
                  className="glass-hover relative rounded-2xl overflow-hidden"
                  style={{
                    background: isCurrentBidder
                      ? 'rgba(255,252,245,0.80)'
                      : 'rgba(243,238,230,0.60)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: isCurrentBidder
                      ? `2px solid ${t.color}`
                      : '1px solid rgba(255,255,255,0.28)',
                    boxShadow: isCurrentBidder
                      ? `0 6px 24px ${t.color}30, 0 2px 8px rgba(0,0,0,0.10)`
                      : '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Team color left strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: t.color }}
                  />

                  <div style={{ paddingLeft: '1rem', paddingRight: '0.75rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.shortName}
                            className="w-7 h-7 object-contain flex-shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                        )}
                        <span
                          className={`text-xs font-bold uppercase truncate ${isUser ? 'underline' : ''}`}
                          style={{ color: '#2B2B2B' }} title={t.name}
                        >
                          {t.shortName}{isUser ? ' (You)' : ''}
                        </span>
                      </div>
                      {isCurrentBidder && (
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0"
                          style={{ background: t.color, color: '#fff' }}
                        >
                          BID
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="stat-chip">
                        <span className="stat-chip__label">Purse</span>
                        <span className="stat-chip__value">₹{t.purse.toFixed(2)} Cr</span>
                      </div>
                      <div className="stat-chip text-right">
                        <span className="stat-chip__label">Squad</span>
                        <span className="stat-chip__value">{t.players.length}/25</span>
                      </div>
                    </div>

                    {claimedBy && (
                      <div
                        className="mt-2 pt-1.5 text-[9px] font-medium truncate"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.22)', color: '#9C9389' }}
                      >
                        {claimedBy.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sold / Unsold splash */}
      {(auctionStatus === 'sold_splash' || auctionStatus === 'unsold_splash') && (
        <BiddingEffectsOverlay
          status={auctionStatus === 'sold_splash' ? 'sold' : 'unsold'}
          playerName={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.player.name : currentPlayer.name}
          playerRole={
            auctionStatus === 'sold_splash' && lastWinner
              ? lastWinner.player.role.replace('_', ' ')
              : currentPlayer.role.replace('_', ' ')
          }
          teamName={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.name : undefined}
          teamLogoUrl={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.logoUrl : undefined}
          teamColor={auctionStatus === 'sold_splash' && lastWinner ? lastWinner.team.color : undefined}
          amountStr={
            auctionStatus === 'sold_splash' && lastWinner
              ? `${lastWinner.price.toFixed(2)} Crore`
              : `${currentPlayer.base_price.toFixed(2)} Crore`
          }
          onClose={nextPlayer}
        />
      )}
    </div>
  );
};
