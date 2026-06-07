'use client';

import React from 'react';
import { useMultiplayer } from '../context/MultiplayerContext';
import { getBiddingRecommendations, analyzeSquad } from '../utils/aiEngine';

export const MultiplayerAIAdvisor: React.FC = () => {
  const { userTeamId, teams, players } = useMultiplayer();
  const userTeam = teams.find(t => t.id === userTeamId);

  if (!userTeam) {
    return (
      <div className="glass p-6 h-full flex flex-col justify-center items-center text-center text-white">
        <span className="text-2xl mb-2">🤖</span>
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider">
          AI Squad Advisor
        </h3>
        <p className="text-xs text-white/60 mt-2 font-medium">
          Claim a franchise to receive real-time draft suggestions and regulations checking.
        </p>
      </div>
    );
  }

  const upcomingPool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const report = analyzeSquad(userTeam.players, userTeam.purse);
  const advice = getBiddingRecommendations(userTeam.players, userTeam.purse, upcomingPool);

  const recommendedPlayer = players.find(p => p.id === advice.recommendedId);

  return (
    <div className="glass p-6 h-full flex flex-col justify-between">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-base font-bold text-white tracking-tight">
            AI Squad Advisor
          </h3>
        </div>

        {/* Warnings and Checklist */}
        <div className="space-y-3 mb-6">
          {report.errors.map((err, i) => (
            <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/20 text-[#FF453A] text-xs font-semibold animate-pulse">
              <span className="text-base leading-none">⚠️</span>
              <span>{err}</span>
            </div>
          ))}

          {report.warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] text-xs font-medium">
              <span className="text-base leading-none">💡</span>
              <span>{warn}</span>
            </div>
          ))}

          {report.errors.length === 0 && report.warnings.length === 0 && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158] text-xs font-semibold">
              <span className="text-base leading-none">✅</span>
              <span>Roster satisfies all minimum role and squad size regulations! Excellent draft balance.</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Recommendation */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.08)]">
        <h4 className="section-label mb-3">
          AI Target Recommendation
        </h4>
        
        {recommendedPlayer ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#C8A24D] block tracking-wider mb-0.5">
                  Top Suggestion
                </span>
                <span className="text-sm font-bold text-white block">
                  {recommendedPlayer.name}
                </span>
                <span className="text-[10px] text-white/60 block uppercase font-semibold mt-0.5">
                  {recommendedPlayer.role.replace('_', ' ')} (OVR {recommendedPlayer.rating})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-white/40 block uppercase font-bold">Base Price</span>
                <span className="text-xs font-black text-white">
                  ₹{recommendedPlayer.base_price.toFixed(2)} Cr
                </span>
              </div>
            </div>

            <p className="text-xs text-white/60 italic font-medium">
              &quot;{advice.reason}&quot;
            </p>

            {/* Alternatives */}
            {advice.alternatives.length > 0 && (
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-white/40 font-bold mb-2">
                  Budget-Friendly Alternatives
                </span>
                <div className="space-y-2">
                  {advice.alternatives.map((alt) => (
                    <div key={alt.id} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs">
                      <div>
                        <span className="font-bold text-white">{alt.name}</span>
                        <span className="text-[9px] text-white/60 uppercase block font-semibold">
                          {alt.role.replace('_', ' ')} (OVR {alt.rating})
                        </span>
                      </div>
                      <span className="font-bold text-[#C8A24D]">
                        ₹{alt.base_price.toFixed(2)} Cr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/60 text-center py-6 font-semibold">
            All players drafted! Roster balance finalized.
          </p>
        )}
      </div>
    </div>
  );
};

export default MultiplayerAIAdvisor;
