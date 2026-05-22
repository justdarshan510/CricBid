'use client';

import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { getBiddingRecommendations, analyzeSquad } from '../utils/aiEngine';

export const AIAdvisor: React.FC = () => {
  const { userTeamId, teams, players } = useAuction();
  const userTeam = teams.find(t => t.id === userTeamId);

  if (!userTeam) return null;

  const upcomingPool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const report = analyzeSquad(userTeam.players, userTeam.purse);
  const advice = getBiddingRecommendations(userTeam.players, userTeam.purse, upcomingPool);

  const recommendedPlayer = players.find(p => p.id === advice.recommendedId);

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl h-full flex flex-col justify-between">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-base font-black text-white uppercase tracking-wider">
            AI Squad Advisor
          </h3>
        </div>

        {/* Warnings and Checklist */}
        <div className="space-y-3 mb-6">
          {report.errors.map((err, i) => (
            <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold animate-pulse">
              <span className="text-base">⚠️</span>
              <span>{err}</span>
            </div>
          ))}

          {report.warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-yellow-950/50 border border-yellow-800/30 text-yellow-400 text-xs">
              <span className="text-base">💡</span>
              <span>{warn}</span>
            </div>
          ))}

          {report.errors.length === 0 && report.warnings.length === 0 && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 text-xs font-semibold">
              <span className="text-base">✅</span>
              <span>Roster satisfies all minimum role and squad size regulations! Excellent draft balance.</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Recommendation */}
      <div className="pt-4 border-t border-slate-900">
        <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-3">
          AI Target Recommendation
        </h4>
        
        {recommendedPlayer ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-yellow-400 block tracking-wider">
                  Top Suggestion
                </span>
                <span className="text-sm font-extrabold text-white block">
                  {recommendedPlayer.name}
                </span>
                <span className="text-[10px] text-slate-400 block uppercase">
                  {recommendedPlayer.role.replace('_', ' ')} (OVR {recommendedPlayer.rating})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase">Base Price</span>
                <span className="text-xs font-black text-slate-300">
                  {recommendedPlayer.base_price.toFixed(2)} Cr
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              &quot;{advice.reason}&quot;
            </p>

            {/* Alternatives */}
            {advice.alternatives.length > 0 && (
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                  Budget-Friendly Alternatives
                </span>
                <div className="space-y-2">
                  {advice.alternatives.map((alt) => (
                    <div key={alt.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-xs">
                      <div>
                        <span className="font-semibold text-slate-300">{alt.name}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">
                          {alt.role.replace('_', ' ')} (OVR {alt.rating})
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-400">
                        {alt.base_price.toFixed(2)} Cr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">
            All players drafted! Roster balance finalized.
          </p>
        )}
      </div>
    </div>
  );
};
export default AIAdvisor;
