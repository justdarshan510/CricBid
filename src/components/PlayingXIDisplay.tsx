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
        <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl bg-white/5 border border-dashed border-white/20 w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 hover:scale-105 hover:border-[#9F8469]/60 hover:bg-white/10 group cursor-pointer shadow-sm">
          <span className="text-xs text-white/40 group-hover:text-[#9F8469] transition-all duration-300">＋</span>
          <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-white/40 group-hover:text-white transition-colors font-bold mt-0.5 sm:mt-1 text-center leading-tight px-0.5">
            {slotLabel}
          </span>
        </div>
      );
    }

    const roleColors: Record<string, string> = {
      opener:           'rgba(155,45,30,0.75)',
      middle_order:     'rgba(120,75,15,0.75)',
      finisher:         'rgba(65,60,150,0.75)',
      spinner:          'rgba(30,110,55,0.75)',
      death_bowler:     'rgba(15,85,175,0.75)',
      powerplay_bowler: 'rgba(15,110,150,0.75)',
      all_rounder:      'rgba(110,85,50,0.75)',
    };

    const accentColor = roleColors[player.role] || '#1D1D1F';

    return (
      <div 
        className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 w-16 h-16 sm:w-20 sm:h-20 shadow-md relative group transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{ borderTop: `3px solid ${accentColor}` }}
        title={`${player.name} (${player.role.replace('_', ' ')}) - Rating: ${player.rating}`}
      >
        {/* Overseas icon */}
        {player.overseas && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 animate-pulse" title="Overseas Player" />
        )}

        {/* Rating overlay */}
        <span className="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-[7px] sm:text-[8px] font-bold text-white">
          {player.rating}
        </span>

        {/* Small Jersey Icon */}
        <div className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center bg-white/5 rounded-full border border-white/10 group-hover:bg-[#9F8469]/15 transition-all duration-300 mt-0.5 sm:mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white/75 group-hover:text-[#9F8469] transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46L16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2L3.62 3.46a2 2 0 0 0-2.41.65l-1 1.5a2 2 0 0 0 .2 2.65L4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9l3.59-2.74a2 2 0 0 0 .2-2.65l-1-1.5a2 2 0 0 0-2.41-.65z" />
          </svg>
        </div>

        {/* Player Name */}
        <span className="text-[8px] sm:text-[9px] font-bold text-white mt-0.5 sm:mt-1 truncate w-full text-center tracking-tight px-0.5">
          {player.name.split(' ').pop()}
        </span>

        {/* Role label */}
        <span className="text-[5.5px] sm:text-[7px] text-white/60 uppercase tracking-wider sm:tracking-widest truncate w-full text-center mt-0.5 leading-none font-semibold">
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
          <div className="flex justify-center space-x-6 sm:space-x-12 -mt-4">
            {renderPlayerBadge(openers[0], 'Opener 1')}
            {renderPlayerBadge(openers[1], 'Opener 2')}
          </div>

          {/* Row 3: Middle Order */}
          <div className="flex justify-center space-x-3 sm:space-x-6 -mt-2">
            {renderPlayerBadge(middleOrder[0], 'Middle 3')}
            {renderPlayerBadge(middleOrder[1], 'Middle 4')}
            {renderPlayerBadge(middleOrder[2], 'Finisher 5')}
          </div>

          {/* Row 4: All Rounders */}
          <div className="flex justify-center space-x-6 sm:space-x-12 -mt-2">
            {renderPlayerBadge(allRounders[0], 'All-R 6')}
            {renderPlayerBadge(allRounders[1], 'All-R 7')}
          </div>

          {/* Row 5: Bowlers (Bottom) */}
          <div className="flex justify-center space-x-1.5 sm:space-x-4 -mt-2">
            {renderPlayerBadge(bowlers[0], 'Spinner')}
            {renderPlayerBadge(bowlers[1], 'Bowler')}
            {renderPlayerBadge(bowlers[2], 'Bowler')}
            {renderPlayerBadge(bowlers[3], 'Bowler')}
          </div>
        </div>
      </div>

      {/* Warnings & Guidelines block */}
      {warnings.length > 0 && (
        <div className="p-3.5 bg-[rgba(201,125,0,0.08)] border border-[rgba(201,125,0,0.20)] text-[#AE5600] rounded-2xl text-[11px] space-y-1">
          <span className="font-bold uppercase block tracking-wider text-[9px] mb-1">
            Playing XI Assembly Flags:
          </span>
          {warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-1.5 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayingXIDisplay;
