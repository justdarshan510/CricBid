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

  const renderPlayerBadge = (player: Player | undefined, slotLabel: string) => {
    if (!player) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/5 border border-dashed border-white/20 w-20 h-20 transition-all duration-300 hover:scale-105 hover:border-[#C8A24D]/60 hover:bg-white/10 group cursor-pointer shadow-sm">
          <span className="text-xs text-white/40 group-hover:text-[#C8A24D] transition-all duration-300">＋</span>
          <span className="text-[8px] uppercase tracking-wider text-white/40 group-hover:text-white transition-colors font-bold mt-1 text-center leading-tight px-1">
            {slotLabel}
          </span>
        </div>
      );
    }

    const roleColors: Record<string, string> = {
      opener: '#FF453A',
      middle_order: '#FF9F0A',
      finisher: '#5E5CE6',
      spinner: '#30A64A',
      death_bowler: '#0A84FF',
      powerplay_bowler: '#2A9FCC',
      all_rounder: '#C8A24D'
    };

    const accentColor = roleColors[player.role] || '#1D1D1F';

    return (
      <div 
        className="flex flex-col items-center justify-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 w-20 h-20 shadow-md relative group transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{ borderTop: `3px solid ${accentColor}` }}
        title={`${player.name} (${player.role.replace('_', ' ')}) - Rating: ${player.rating}`}
      >
        {/* Overseas icon */}
        {player.overseas && (
          <span className="absolute top-1 right-1.5 text-[8px] text-[#C8A24D]">✈</span>
        )}

        {/* Rating overlay */}
        <span className="absolute top-1 left-1.5 text-[8px] font-bold text-white">
          {player.rating}
        </span>

        {/* Small Jersey Icon */}
        <div className="w-7 h-7 flex items-center justify-center text-xs bg-white/5 rounded-full border border-white/10 group-hover:bg-[#C8A24D]/15 transition-all duration-300 mt-1">
          👕
        </div>

        {/* Player Name */}
        <span className="text-[9px] font-bold text-white mt-1 truncate w-full text-center tracking-tight px-0.5">
          {player.name.split(' ').pop()}
        </span>

        {/* Role label */}
        <span className="text-[7px] text-white/60 uppercase tracking-widest truncate w-full text-center mt-0.5 leading-none font-semibold">
          {player.is_wicketkeeper ? 'Keeper' : player.role.replace('_', ' ')}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pitch Layout Plate */}
      <div className="glass rounded-3xl p-4 overflow-hidden relative shadow-md" style={{ background: 'rgba(20, 35, 25, 0.60)', border: '1px solid var(--glass-border)' }}>
        {/* Pitch Lines (Crease Layout) */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-white/35 border-t border-dashed pointer-events-none"></div>
        
        {/* Cricket Crease Boundaries */}
        <div className="absolute inset-x-12 top-6 h-10 border-x border-b border-white/25 pointer-events-none rounded-b-lg"></div>
        <div className="absolute inset-x-12 bottom-6 h-10 border-x border-t border-white/25 pointer-events-none rounded-t-lg"></div>
        
        {/* Pitch crease marks */}
        <div className="absolute left-1/2 -translate-x-1/2 top-10 w-12 h-0.5 bg-white/45 rounded pointer-events-none"></div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-12 h-0.5 bg-white/45 rounded pointer-events-none"></div>

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
        <div className="p-3.5 bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] rounded-2xl text-[11px] space-y-1">
          <span className="font-bold uppercase block tracking-wider text-[9px] mb-1">
            Playing XI Assembly Flags:
          </span>
          {warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-1.5 font-semibold">
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
