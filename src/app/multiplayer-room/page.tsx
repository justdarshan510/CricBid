'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { MultiplayerLiveBiddingBoard } from '../../components/MultiplayerLiveBiddingBoard';
import { TeamBackgroundProvider } from '../../components/TeamBackgroundProvider';


export default function MultiplayerRoomPage() {
  const router = useRouter();
  const { roomCode, userTeamId } = useMultiplayer();

  useEffect(() => {
    if (!roomCode) {
      router.push('/lobby');
    }
  }, [roomCode, router]);

  if (!roomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
        <p className="mt-4 text-[#94A3B8]">Redirecting to multiplayer lobby...</p>
      </div>
    );
  }

  return (
    <TeamBackgroundProvider teamId={userTeamId}>
      <div className="py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#F8FAFC] uppercase tracking-tight">
              Multiplayer Draft Arena
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              Real-time multiplayer bidding room. Compete live against your friends to build the ultimate franchise squad.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 w-full">
          {/* Main board */}
          <div className="w-full flex-1">
            <MultiplayerLiveBiddingBoard />
          </div>
        </div>
      </div>
    </TeamBackgroundProvider>
  );
}
