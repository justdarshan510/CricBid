'use client';

import React from 'react';
import { Player } from '../data/players';
import { solvePlayingXI } from '../utils/aiEngine';

interface PlayingXIDisplayProps {
  squad: Player[];
}

export const PlayingXIDisplay: React.FC<PlayingXIDisplayProps> = ({ squad }) => {
  const { playingXI, warnings } = solvePlayingXI(squad);

  // Distribute players into positions on the pitch
  const openers = playingXI.filter(p => p.role === 'opener').slice(0, 2);
  const wicketkeeper = playingXI.find(p => p.is_wicketkeeper) || playingXI.find(p => p.role === 'middle_order' && p.is_wicketkeeper);
  
  // Exclude keeper and openers from other selections to avoid duplicate rendering
  const excludedIds = new Set([
    ...openers.map(o => o.id),
    ...(wicketkeeper ? [wicketkeeper.id] : [])
  ]);

  const middleOrder = playingXI.filter(p => !excludedIds.has(p.id) && (p.role === 'middle_order' || p.role === 'finisher')).slice(0, 3);
  const allRounders = playingXI.filter(p => !excludedIds.has(p.id) && p.role === 'all_rounder').slice(0, 2);
  
  const bowlers = playingXI.filter(p => 
    !excludedIds.has(p.id) && 
    (p.role === 'spinner' || p.role === 'death_bowler' || p.role === 'powerplay_bowler')
  );

  // Fill in placeholders if we have missing slots
  const renderPlayerBadge = (player: Player | undefined, slotLabel: string) => {
    if (!player) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 w-20 h-20">
          <span className="text-[14px] text-slate-700">➕</span>
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mt-1">
            {slotLabel}
          </span>
        </div>
      );
    }

    const roleBorders: Record<string, string> = {
      opener: 'border-red-500 shadow-red-500/10',
      middle_order: 'border-yellow-500 shadow-yellow-500/10',
      finisher: 'border-purple-500 shadow-purple-500/10',
      spinner: 'border-emerald-500 shadow-emerald-500/10',
      death_bowler: 'border-blue-500 shadow-blue-500/10',
      powerplay_bowler: 'border-cyan-500 shadow-cyan-500/10',
      all_rounder: 'border-pink-500 shadow-pink-500/10'
    };

    const borderStyle = roleBorders[player.role] || 'border-slate-600';

    return (
      <div 
        className={`flex flex-col items-center justify-center p-1.5 rounded-2xl bg-slate-950/90 border-2 ${borderStyle} w-20 h-20 shadow-lg relative group transition hover:scale-105`}
        title={`${player.name} (${player.role.replace('_', ' ')}) - Rating: ${player.rating}`}
      >
        {/* Overseas icon */}
        {player.overseas && (
          <span className="absolute top-0.5 right-1.5 text-[8px] text-yellow-400">✈</span>
        )}

        {/* Rating overlay */}
        <span className="absolute top-0.5 left-1.5 text-[7px] font-black text-slate-400">
          {player.rating}
        </span>

        {/* Small Jersey Icon */}
        <div className="w-8 h-8 flex items-center justify-center text-xs">
          👕
        </div>

        {/* Player Name */}
        <span className="text-[9px] font-extrabold text-slate-100 mt-1 truncate w-full text-center">
          {player.name.split(' ').pop()}
        </span>

        {/* Role label */}
        <span className="text-[7px] text-slate-400 uppercase tracking-widest truncate w-full text-center">
          {player.is_wicketkeeper ? 'WK-Keeper' : player.role.replace('_', ' ')}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pitch Layout Plate */}
      <div className="glass-card rounded-3xl border border-slate-800 p-4 overflow-hidden relative shadow-inner">
        {/* Background grass pattern */}
        <div className="absolute inset-0 pitch-bg opacity-30 pointer-events-none"></div>
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 border-t border-dashed pointer-events-none"></div>
        
        {/* Cricket Crease Boundaries */}
        <div className="absolute inset-x-12 top-6 h-8 border border-white/15 border-t-0 pointer-events-none rounded-b-xl"></div>
        <div className="absolute inset-x-12 bottom-6 h-8 border border-white/15 border-b-0 pointer-events-none rounded-t-xl"></div>

        {/* Visual stadium content */}
        <div className="relative z-10 flex flex-col justify-between h-[420px] max-w-sm mx-auto">
          {/* Row 1: Wicket Keeper (Top) */}
          <div className="flex justify-center">
            {renderPlayerBadge(wicketkeeper, 'W-Keeper')}
          </div>

          {/* Row 2: Openers */}
          <div className="flex justify-center space-x-12 -mt-4">
            {renderPlayerBadge(openers[0], 'Opener 1')}
            {renderPlayerBadge(openers[1], 'Opener 2')}
          </div>

          {/* Row 3: Middle Order */}
          <div className="flex justify-center space-x-6 -mt-2">
            {renderPlayerBadge(middleOrder[0], 'Middle 3')}
            {renderPlayerBadge(middleOrder[1], 'Middle 4')}
            {renderPlayerBadge(middleOrder[2], 'Finisher 5')}
          </div>

          {/* Row 4: All Rounders */}
          <div className="flex justify-center space-x-12 -mt-2">
            {renderPlayerBadge(allRounders[0], 'All-R 6')}
            {renderPlayerBadge(allRounders[1], 'All-R 7')}
          </div>

          {/* Row 5: Bowlers (Bottom) */}
          <div className="flex justify-center space-x-4 -mt-2">
            {renderPlayerBadge(bowlers[0], 'Spinner')}
            {renderPlayerBadge(bowlers[1], 'Bowler')}
            {renderPlayerBadge(bowlers[2], 'Bowler')}
            {renderPlayerBadge(bowlers[3], 'Bowler')}
          </div>
        </div>
      </div>

      {/* Warnings & Guidelines block */}
      {warnings.length > 0 && (
        <div className="p-3 bg-yellow-950/40 border border-yellow-800/20 text-yellow-400 rounded-xl text-[11px] space-y-1">
          <span className="font-bold uppercase block tracking-wider text-[9px] mb-1">
            Playing XI Assembly Flags:
          </span>
          {warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-1.5">
              <span>•</span>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default PlayingXIDisplay;
