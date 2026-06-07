'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '../../context/AuctionContext';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { PlayingXIDisplay } from '../../components/PlayingXIDisplay';
import { PlayerCard } from '../../components/PlayerCard';
import { solvePlayingXI, analyzeSquad } from '../../utils/aiEngine';

export default function TeamDashboardPage() {
  const router = useRouter();
  const localAuction = useAuction();
  const multiplayer = useMultiplayer();

  const isMultiplayerActive = !!multiplayer.roomCode;
  const { teams, userTeamId } = isMultiplayerActive ? multiplayer : localAuction;

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'roster' | 'pitch'>('roster');

  useEffect(() => {
    if (!userTeamId) {
      router.push('/');
    } else {
      setSelectedTeamId(userTeamId);
    }
  }, [userTeamId, router]);

  if (!userTeamId || !selectedTeamId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8A24D]"></div>
        <p className="mt-4 text-[#6E6E73]">Redirecting to team selection...</p>
      </div>
    );
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const squadReport = analyzeSquad(selectedTeam.players, selectedTeam.purse);
  
  // Calculate average rating
  const avgRating = selectedTeam.players.length > 0
    ? Math.round(selectedTeam.players.reduce((sum, p) => sum + p.rating, 0) / selectedTeam.players.length)
    : 0;

  const roleLabels: Record<string, string> = {
    opener: 'Openers',
    middle_order: 'Middle Order',
    finisher: 'Finishers',
    all_rounder: 'All Rounders',
    spinner: 'Spinners',
    death_bowler: 'Death Bowlers',
    powerplay_bowler: 'Powerplay Bowlers'
  };

  return (
    <div className="py-6 space-y-6 text-white">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Franchise Headquarters
        </h1>
        <p className="text-xs text-white/60 mt-1">
          Review squads, assess role balances, and view the automated Playing XI for all 10 franchises.
        </p>
      </div>

      {/* Team Tabs Selector (Horizontal scrolling bar) */}
      <div className="flex overflow-x-auto pb-3 gap-2 border-b border-[rgba(255,255,255,0.08)] scrollbar-thin">
        {teams.map((t) => {
          const isSelected = t.id === selectedTeamId;
          const isUser = t.id === userTeamId;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-3.5 py-2 rounded-full border text-xs font-bold uppercase whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              style={{
                borderColor: isSelected ? t.color : undefined,
                borderWidth: isSelected ? '2px' : '1px'
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: t.color }}
              ></span>
              <span>{t.shortName}</span>
              {isUser && <span className="text-[10px]" title="Your Franchise">👤</span>}
            </button>
          );
        })}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Franchise stats & warnings (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 relative overflow-hidden">
            {/* Franchise Banner highlight */}
            <div
              className="absolute top-0 inset-x-0 h-1"
              style={{ backgroundColor: selectedTeam.color }}
            ></div>

            {/* Header info */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  {selectedTeamId === userTeamId ? 'Your Franchise' : 'AI Competitor'}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedTeam.name}
                </h2>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm relative overflow-hidden"
                style={{
                  backgroundColor: `${selectedTeam.color}15`,
                  border: `1.5px solid ${selectedTeam.color}40`,
                }}
              >
                {selectedTeam.logoUrl ? (
                  <img
                    src={selectedTeam.logoUrl}
                    alt={selectedTeam.shortName}
                    className="w-8 h-8 object-contain drop-shadow"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      if (el.nextSibling) (el.nextSibling as HTMLElement).style.display = 'block';
                    }}
                  />
                ) : null}
                <span
                  className="font-bold text-xs"
                  style={{ color: selectedTeam.color, display: selectedTeam.logoUrl ? 'none' : 'block' }}
                >
                  {selectedTeam.shortName}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 p-3 shadow-sm rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-semibold">Purse Remaining</span>
                <span className="text-base font-bold text-white">{selectedTeam.purse.toFixed(2)} Cr</span>
                <span className="text-[9px] text-white/60 block mt-0.5">Limit: 120.0 Cr</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 shadow-sm rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-semibold">Squad Size</span>
                <span className="text-base font-bold text-white">{selectedTeam.players.length} / 25</span>
                <span className="text-[9px] text-white/60 block mt-0.5">Min: 12 | Max: 25</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 shadow-sm rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-semibold">Overseas Stars</span>
                <span className="text-base font-bold text-white">{squadReport.overseasCount} / 8</span>
                <span className="text-[9px] text-white/60 block mt-0.5">Max limit: 8</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 shadow-sm rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-semibold">Average Rating</span>
                <span className="text-base font-bold text-white">{avgRating} OVR</span>
                <span className="text-[9px] text-white/60 block mt-0.5">Squad weight</span>
              </div>
            </div>

            {/* Role Composition */}
            <div className="space-y-2.5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <h3 className="section-label mb-3">
                Role Distribution
              </h3>
              {Object.entries(squadReport.roleCounts).map(([role, count]) => {
                const percentage = selectedTeam.players.length > 0 
                  ? (count / selectedTeam.players.length) * 100 
                  : 0;
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-white/60">
                      <span>{roleLabels[role]}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: selectedTeam.color,
                          width: `${percentage}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Squad Rules & Checklist Panel */}
          <div className="glass p-6 space-y-4">
            <h3 className="section-label border-b border-[rgba(255,255,255,0.08)] pb-2.5">
              Squad Compliance Check
            </h3>
            
            <div className="space-y-2.5">
              {squadReport.errors.map((err, i) => (
                <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/20 text-[#FF453A] text-xs font-semibold">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{err}</span>
                </div>
              ))}

              {squadReport.warnings.map((warn, i) => (
                <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] text-xs font-medium">
                  <span className="text-base leading-none">💡</span>
                  <span>{warn}</span>
                </div>
              ))}

              {squadReport.errors.length === 0 && squadReport.warnings.length === 0 && selectedTeam.players.length > 0 && (
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158] text-xs font-semibold">
                  <span className="text-base leading-none">✅</span>
                  <span>All rules satisfied! Roster is balanced and ready for simulation runs.</span>
                </div>
              )}

              {selectedTeam.players.length === 0 && (
                <div className="text-xs text-white/40 text-center py-4 italic font-medium">
                  Franchise has not drafted any players yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Roster List or Pitch Visualizer (Col Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Toggle */}
          <div className="flex justify-between items-center bg-white/5 border border-white/10 p-1.5 rounded-2xl">
            <div className="flex space-x-1.5">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-white border-none text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                📋 Full Squad ({selectedTeam.players.length})
              </button>
              <button
                onClick={() => setActiveTab('pitch')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'pitch'
                    ? 'bg-white border-none text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                🏏 Strongest Playing XI (11)
              </button>
            </div>
            
            <div className="pr-2 text-[10px] text-white/40 uppercase tracking-widest font-bold hidden md:block">
              {activeTab === 'roster' ? 'Browsing drafted pool' : 'Tactical pitch preview'}
            </div>
          </div>

          {/* Roster tab */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {selectedTeam.players.length === 0 ? (
                <div className="glass p-12 text-center text-white">
                  <h3 className="text-lg font-bold">Empty Draft Desk</h3>
                  <p className="text-xs text-white/60 mt-1.5 max-w-sm mx-auto font-medium">
                    This franchise has not signed any players yet. Proceed to the Live Auction Room to bid on active players.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedTeam.players.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pitch tab */}
          {activeTab === 'pitch' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Pitch Visualizer (Span 7) */}
              <div className="md:col-span-7">
                <PlayingXIDisplay squad={selectedTeam.players} />
              </div>

              {/* Roster bench players list (Span 5) */}
              <div className="md:col-span-5">
                <div className="glass p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="section-label mb-4 border-b border-[rgba(255,255,255,0.08)] pb-2">
                      Roster Substitutes / Reserves
                    </h3>
                    
                    {/* Get lists of bench players */}
                    {(() => {
                      const { playingXI } = solvePlayingXI(selectedTeam.players);
                      const playingXIIds = new Set(playingXI.map(p => p.id));
                      const bench = selectedTeam.players.filter(p => !playingXIIds.has(p.id));

                      if (bench.length === 0) {
                        return (
                          <p className="text-xs text-white/40 text-center py-12 italic font-medium">
                            No bench players. Formulate a squad larger than 11 players to rotate reserves.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {bench.map((player) => (
                            <div
                              key={player.id}
                              className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-white block truncate">
                                  {player.name}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-white/60 flex items-center space-x-1 font-semibold mt-0.5">
                                  <span>{player.role.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>OVR {player.rating}</span>
                                  {player.overseas && <span className="text-[#C8A24D]">✈</span>}
                                </span>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-[9px] text-white/40 block uppercase font-bold">Price</span>
                                <span className="text-xs font-black text-white">
                                  ₹{player.sold_price?.toFixed(2)} Cr
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] text-[10px] text-white/60 font-medium leading-normal">
                    💡 The playing XI optimizer automatically arranges your best-rated players while complying with the maximum 4 overseas stars and wicketkeeper restrictions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
