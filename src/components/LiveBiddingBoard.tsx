'use client';

import React from 'react';
import { useAuction, getNextBidAmount } from '../context/AuctionContext';
import { PlayerCard } from './PlayerCard';
import { BiddingEffectsOverlay } from './BiddingEffectsOverlay';
import { VoiceControlPanel } from './VoiceControlPanel';

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
    autoSimulateActivePlayer,
    executeVoiceCommand
  } = useAuction();

  if (!currentPlayer) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center">
        <h3>No Player Under the Hammer</h3>
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
  const userHasBudget = userTeam
    ? userTeam.purse >= nextBidAmount
    : false;

  const userSquadFull = userTeam
    ? userTeam.players.length >= 25
    : false;

  const userOverseasLimit = userTeam
    ? currentPlayer.overseas &&
    userTeam.players.filter(p => p.overseas).length >= 8
    : false;

  const canUserBid =
    userTeam &&
    !userHoldsBid &&
    userHasBudget &&
    !userSquadFull &&
    !userOverseasLimit &&
    !isPaused;

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (timer / 10) * circumference;

  return (
    <div className="flex flex-col space-y-6">

      <VoiceControlPanel
        onVoiceCommand={executeVoiceCommand}
        isHost={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-4">
          <PlayerCard
            player={currentPlayer}
            showBidOverlay={false}
          />
        </div>

        {/* CENTER */}
        <div className="lg:col-span-5">

          <div className="glass-card p-6 rounded-3xl">

            <div className="flex justify-between items-center">

              <div>
                <span>
                  {isPaused
                    ? 'Paused'
                    : 'LIVE BIDDING'}
                </span>
              </div>

              <div className="relative">

                <svg width="64" height="64">

                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="gray"
                    strokeWidth="4"
                    fill="transparent"
                  />

                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="gold"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>

                <span>{timer}</span>

              </div>
            </div>

            <div className="text-center py-6">

              <h2>
                {currentBid === 0
                  ? `${currentPlayer.base_price.toFixed(2)} Cr`
                  : `${currentBid.toFixed(2)} Cr`}
              </h2>

              {currentBidder && (
                <p>
                  {currentBidder.name}
                </p>
              )}

            </div>

            <button
              onClick={placeUserBid}
              disabled={!canUserBid}
              className="w-full py-4 rounded-xl"
            >
              {userHoldsBid
                ? 'You Hold High Bid'
                : `Place Bid ${nextBidAmount.toFixed(2)} Cr`}
            </button>

            <div className="grid grid-cols-3 gap-2 mt-3">

              <button onClick={
                isPaused
                  ? resumeAuction
                  : pauseAuction
              }>
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button onClick={skipPlayer}>
                Skip
              </button>

              <button onClick={autoSimulateActivePlayer}>
                Fast Solve
              </button>

            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3">

          <div className="glass-card p-4 h-96 overflow-y-auto">

            {logs.map((log, index) => (
              <div key={index}>
                {log}
              </div>
            ))}

          </div>

        </div>

        {/* TEAMS */}
        <div className="lg:col-span-12">

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

            {teams.map((t) => (
              <div
                key={t.id}
                className="glass-card p-3 rounded-xl"
              >
                <div>{t.shortName}</div>
                <div>{t.purse.toFixed(2)} Cr</div>
                <div>{t.players.length}/25</div>
              </div>
            ))}

          </div>

        </div>

      </div>

      {(auctionStatus === 'sold_splash' ||
        auctionStatus === 'unsold_splash') && (

          <BiddingEffectsOverlay
            status={
              auctionStatus === 'sold_splash'
                ? 'sold'
                : 'unsold'
            }
            playerName={
              auctionStatus === 'sold_splash' &&
                lastWinner
                ? lastWinner.player.name
                : currentPlayer.name
            }
            playerRole={
              auctionStatus === 'sold_splash' &&
                lastWinner
                ? lastWinner.player.role.replace('_', ' ')
                : currentPlayer.role.replace('_', ' ')
            }
            teamName={
              lastWinner?.team.name
            }
            teamLogoUrl={
              lastWinner?.team.logoUrl
            }
            teamColor={
              lastWinner?.team.color
            }
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