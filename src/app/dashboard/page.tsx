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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        <p className="mt-4 text-slate-400">Redirecting to team selection...</p>
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
    <div className="py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          Franchise Headquarters
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review squads, assess role balances, and view the automated Playing XI for all 10 franchises.
        </p>
      </div>

      {/* Team Tabs Selector (Horizontal scrolling bar) */}
      <div className="flex overflow-x-auto pb-3 gap-2 border-b border-slate-900 scrollbar-thin">
        {teams.map((t) => {
          const isSelected = t.id === selectedTeamId;
          const isUser = t.id === userTeamId;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                isSelected
                  ? 'text-white'
                  : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: isSelected ? `${t.color}15` : undefined,
                borderColor: isSelected ? t.color : undefined,
                boxShadow: isSelected ? `0 0 10px ${t.color}20` : undefined,
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
          <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden">
            {/* Franchise Banner highlight */}
            <div
              className="absolute top-0 inset-x-0 h-1.5"
              style={{ backgroundColor: selectedTeam.color }}
            ></div>

            {/* Header info */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {selectedTeamId === userTeamId ? 'Your Franchise' : 'AI Competitor'}
                </span>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  {selectedTeam.name}
                </h2>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner"
                style={{
                  backgroundColor: `${selectedTeam.color}15`,
                  border: `1.5px solid ${selectedTeam.color}40`,
                  color: selectedTeam.color
                }}
              >
                {selectedTeam.shortName}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Purse Remaining</span>
                <span className="text-base font-black text-yellow-400">{selectedTeam.purse.toFixed(2)} Cr</span>
                <span className="text-[9px] text-slate-600 block mt-0.5">Limit: 120.0 Cr</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Squad Size</span>
                <span className="text-base font-black text-white">{selectedTeam.players.length} / 25</span>
                <span className="text-[9px] text-slate-600 block mt-0.5">Min: 12 | Max: 25</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Overseas Stars</span>
                <span className="text-base font-black text-white">{squadReport.overseasCount} / 8</span>
                <span className="text-[9px] text-slate-600 block mt-0.5">Max limit: 8</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Average Rating</span>
                <span className="text-base font-black text-white">{avgRating} OVR</span>
                <span className="text-[9px] text-slate-600 block mt-0.5">Squad weight</span>
              </div>
            </div>

            {/* Role Composition */}
            <div className="space-y-2.5 pt-4 border-t border-slate-900">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-3">
                Role Distribution
              </h3>
              {Object.entries(squadReport.roleCounts).map(([role, count]) => {
                const percentage = selectedTeam.players.length > 0 
                  ? (count / selectedTeam.players.length) * 100 
                  : 0;
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                      <span>{roleLabels[role]}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
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
          <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 border-b border-slate-900 pb-2.5">
              Squad Compliance Check
            </h3>
            
            <div className="space-y-2.5">
              {squadReport.errors.map((err, i) => (
                <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{err}</span>
                </div>
              ))}

              {squadReport.warnings.map((warn, i) => (
                <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-yellow-950/50 border border-yellow-800/30 text-yellow-400 text-xs">
                  <span className="text-base leading-none">💡</span>
                  <span>{warn}</span>
                </div>
              ))}

              {squadReport.errors.length === 0 && squadReport.warnings.length === 0 && selectedTeam.players.length > 0 && (
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 text-xs font-semibold">
                  <span className="text-base leading-none">✅</span>
                  <span>All rules satisfied! Roster is balanced and ready for simulation runs.</span>
                </div>
              )}

              {selectedTeam.players.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4 italic">
                  Franchise has not drafted any players yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Roster List or Pitch Visualizer (Col Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Toggle */}
          <div className="flex justify-between items-center bg-slate-950/60 border border-slate-900 p-1.5 rounded-2xl">
            <div className="flex space-x-1.5">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-slate-900 border border-slate-800 text-yellow-400 font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 Full Squad ({selectedTeam.players.length})
              </button>
              <button
                onClick={() => setActiveTab('pitch')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  activeTab === 'pitch'
                    ? 'bg-slate-900 border border-slate-800 text-yellow-400 font-extrabold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏏 Strongest Playing XI (11)
              </button>
            </div>
            
            <div className="pr-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold hidden md:block">
              {activeTab === 'roster' ? 'Browsing drafted pool' : 'Tactical pitch preview'}
            </div>
          </div>

          {/* Roster tab */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {selectedTeam.players.length === 0 ? (
                <div className="glass-card rounded-3xl border border-slate-800 p-12 text-center">
                  <h3 className="text-lg font-bold text-slate-400">Empty Draft Desk</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-4 border-b border-slate-900 pb-2">
                      Roster Substitutes / Reserves
                    </h3>
                    
                    {/* Get lists of bench players */}
                    {(() => {
                      const { playingXI } = solvePlayingXI(selectedTeam.players);
                      const playingXIIds = new Set(playingXI.map(p => p.id));
                      const bench = selectedTeam.players.filter(p => !playingXIIds.has(p.id));

                      if (bench.length === 0) {
                        return (
                          <p className="text-xs text-slate-500 text-center py-12 italic">
                            No bench players. Formulate a squad larger than 11 players to rotate reserves.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {bench.map((player) => (
                            <div
                              key={player.id}
                              className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/60 hover:bg-slate-900/40 transition"
                            >
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs text-slate-200 block truncate">
                                  {player.name}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                                  <span>{player.role.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>OVR {player.rating}</span>
                                  {player.overseas && <span className="text-yellow-400">✈</span>}
                                </span>
                              </div>
                              
                              <div className="text-right">
                                <span className="text-[9px] text-slate-500 block uppercase">Price</span>
                                <span className="text-xs font-black text-yellow-400">
                                  {player.sold_price?.toFixed(2)} Cr
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-900 text-[10px] text-slate-500 leading-normal">
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
