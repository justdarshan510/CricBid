'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '../../context/AuctionContext';
import { LiveBiddingBoard } from '../../components/LiveBiddingBoard';
import { AIAdvisor } from '../../components/AIAdvisor';

export default function AuctionRoomPage() {
  const router = useRouter();
  const { userTeamId } = useAuction();

  useEffect(() => {
    if (!userTeamId) {
      router.push('/');
    }
  }, [userTeamId, router]);

  if (!userTeamId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        <p className="mt-4 text-slate-400">Redirecting to team selection...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Draft Arena
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bidding arena. Monitor your budget limits and AI competitors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main board */}
        <div className="lg:col-span-9">
          <LiveBiddingBoard />
        </div>

        {/* AI advisor panel */}
        <div className="lg:col-span-3">
          <AIAdvisor />
        </div>
      </div>
    </div>
  );
}
