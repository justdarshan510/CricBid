'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player, initialPlayers } from '../data/players';
import { initialTeams } from '../data/teams';

const playerImageMap: Record<string, string> = {};
initialPlayers.forEach(p => {
  if (p.image) { playerImageMap[p.id] = p.image; playerImageMap[p.name.toLowerCase().trim()] = p.image; }
});

const getFlagUrl = (nat: string) => {
  const n = nat.trim().toLowerCase();
  if (n === 'west indies') return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/West_Indies_Cricket_Flag_SVG.svg/40px-West_Indies_Cricket_Flag_SVG.svg.png';
  const map: Record<string,string> = { india:'in',australia:'au','south africa':'za',england:'gb-eng','new zealand':'nz','sri lanka':'lk',srilanka:'lk',afghanistan:'af',bangladesh:'bd',ireland:'ie',zimbabwe:'zw',usa:'us',nepal:'np',netherlands:'nl',scotland:'gb-sct' };
  const code = map[n];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

const roleStyles: Record<string, { label:string; badgeClass:string; avatarColor:string }> = {
  opener:           { label:'Opener',          badgeClass:'badge-role-opener',           avatarColor:'#FF453A' },
  middle_order:     { label:'Middle Order',     badgeClass:'badge-role-middle_order',     avatarColor:'#FF9F0A' },
  finisher:         { label:'Finisher',         badgeClass:'badge-role-finisher',         avatarColor:'#5E5CE6' },
  spinner:          { label:'Spinner',          badgeClass:'badge-role-spinner',          avatarColor:'#30A64A' },
  death_bowler:     { label:'Death Bowler',     badgeClass:'badge-role-death_bowler',     avatarColor:'#0A84FF' },
  powerplay_bowler: { label:'Powerplay Bowler', badgeClass:'badge-role-powerplay_bowler', avatarColor:'#2A9FCC' },
  all_rounder:      { label:'All Rounder',      badgeClass:'badge-role-all_rounder',      avatarColor:'#C8A24D' },
};

interface PlayerCardProps { player: Player; showBidOverlay?: boolean; bidAmount?: number; bidderName?: string; bidderColor?: string; }

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, showBidOverlay=false, bidAmount, bidderName, bidderColor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  useEffect(() => { setImageError(false); }, [player.id, player.image]);

  const style = roleStyles[player.role] || { label: player.role, badgeClass:'', avatarColor:'#6E6E73' };
  const resolvedImage = player.image || playerImageMap[player.id] || playerImageMap[player.name.toLowerCase().trim()] || '';

  const teamAcquiring = player.sold_to ? initialTeams.find(t => t.id === player.sold_to) : null;

  const avatar = useMemo(() => {
    if (resolvedImage && !imageError) {
      return (
        <img src={resolvedImage} alt={player.name}
          className="w-full h-full object-contain z-10 relative pointer-events-none"
          style={{ transform: 'scale(1.08)' }}
          onError={() => setImageError(true)}
        />
      );
    }
    const c = style.avatarColor;
    return (
      <svg viewBox="0 0 100 80" className="w-full h-full opacity-60">
        <ellipse cx="50" cy="72" rx="28" ry="4" fill="rgba(200,162,77,0.12)" />
        <circle cx="45" cy="12" r="4" fill={c} opacity="0.7" />
        {['opener','middle_order','finisher'].includes(player.role)
          ? <path d="M25,65 L35,50 L40,30 L45,20 L50,12 M45,20 L55,22 L65,30 L60,40 M40,30 L30,35 L20,40 M60,40 L68,60 L78,65" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          : player.role === 'all_rounder'
          ? <><circle cx="28" cy="22" r="5" fill={c} opacity="0.5" /><path d="M38,65 L43,45 L45,25 L50,15 M45,25 L55,26 L62,35 L58,45 M30,32 L20,38 L12,25 M58,45 L64,62 L74,66" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
          : <path d="M32,65 L36,52 L40,35 L42,22 L45,15 M40,35 L55,25 L65,12 L50,8 M36,52 L25,48 L15,35 M55,25 L62,45 L70,62 L78,65" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </svg>
    );
  }, [player.id, player.role, resolvedImage, imageError, style.avatarColor]);

  const StatRow = ({ label, value, accent }: { label:string; value:string|number; accent?:string }) => (
    <div className="stat-chip">
      <span className="stat-chip__label">{label}</span>
      <span className="stat-chip__value font-bold text-[#1D1D1F]" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="holo-sheen relative overflow-hidden cursor-pointer group flex flex-col justify-between"
        style={{
          borderRadius: '28px',
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: player.rating >= 87 
            ? '2px solid rgba(200, 162, 77, 0.60)' 
            : '1px solid rgba(255, 255, 255, 0.40)',
          boxShadow: player.rating >= 87 
            ? '0 20px 60px rgba(200, 162, 77, 0.12), 0 20px 60px rgba(0,0,0,0.06)' 
            : '0 20px 60px rgba(0,0,0,0.08)'
        }}
      >
        {/* Avatar plate */}
        <div
          className="h-48 flex items-center justify-center relative overflow-hidden"
          style={{ 
            background: player.rating >= 87 
              ? 'linear-gradient(135deg, rgba(200, 162, 77, 0.08) 0%, rgba(255, 255, 255, 0.3) 100%)' 
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.05) 100%)' 
          }}
        >
          {/* Gold ring avatar frame */}
          <div
            className="gold-ring w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
            style={{ 
              background: 'rgba(255,255,255,0.40)', 
              borderColor: player.rating >= 87 ? '#C8A24D' : 'rgba(255,255,255,0.60)',
              borderWidth: player.rating >= 87 ? '2px' : '1px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}
          >
            {avatar}
          </div>

          {/* OVR Rating Pill */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm"
            style={{ 
              background: player.rating >= 87 ? 'linear-gradient(135deg, #C8A24D 0%, #1D1D1F 100%)' : '#1D1D1F', 
              color: '#fff' 
            }}>
            <span className="opacity-75 text-[9px] font-medium">OVR</span>
            <span>{player.rating}</span>
          </div>

          {/* Special Tier Tag / Nationality */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
            {player.rating >= 90 ? (
              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-[#C8A24D] text-white shadow-sm">
                LEGEND
              </span>
            ) : player.rating >= 85 ? (
              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider bg-[#1D1D1F] text-white shadow-sm">
                ELITE
              </span>
            ) : null}
            <div className="px-2 py-1 rounded-full text-[9px] font-bold shadow-sm"
              style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.85)', color: '#1D1D1F' }}>
              {player.nationality}{player.overseas ? ' ✈' : ''}
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-5 flex-grow flex flex-col justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.35)' }}>
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
              {player.is_wicketkeeper && <span className="badge-pill badge-role-wk">WK</span>}
            </div>

            <div className="flex items-center gap-2 mb-1">
              {getFlagUrl(player.nationality) && (
                <img src={getFlagUrl(player.nationality)} alt={player.nationality}
                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              )}
              <h3 className="text-[16px] font-bold truncate text-[#1D1D1F]" style={{ letterSpacing:'-0.02em' }}>{player.name}</h3>
            </div>

            <p className="text-xs mb-4 truncate text-[#55555A] font-medium">{player.batting_style} · {player.bowling_style}</p>
          </div>

          <div className="flex items-center justify-between pt-3.5 border-t border-[rgba(0,0,0,0.06)]">
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-[#8E8E93]">Base Price</span>
              <span className="text-[15px] font-extrabold text-[#1D1D1F]">₹{player.base_price.toFixed(2)} Cr</span>
            </div>
            {player.status === 'sold' ? (
              <div className="text-right">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#32D74B]">Signed</span>
                <span className="text-[15px] font-extrabold text-[#1D1D1F]">₹{player.sold_price?.toFixed(2)} Cr</span>
              </div>
            ) : player.status === 'unsold' ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" 
                style={{ background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.06)', color:'#8E8E93' }}>Unsold</span>
            ) : (
              <span className="text-xs font-bold text-[#C8A24D] group-hover:translate-x-1 transition-transform duration-200">View stats →</span>
            )}
          </div>
        </div>

        {/* Signed watermark overlay */}
        {player.status === 'sold' && teamAcquiring && (
          <div className="absolute bottom-24 right-4 rotate-[-12deg] z-10 pointer-events-none opacity-90 shadow-sm">
            <div className="border-2 border-dashed font-black text-[9px] px-2.5 py-0.5 rounded uppercase tracking-widest bg-white"
              style={{ borderColor: teamAcquiring.color, color: teamAcquiring.color }}>
              SIGNED · {teamAcquiring.shortName}
            </div>
          </div>
        )}

        {/* Bid overlay */}
        {showBidOverlay && bidAmount !== undefined && bidAmount > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 rounded-[28px]"
            style={{ 
              background: 'rgba(250, 248, 245, 0.92)', 
              backdropFilter: 'blur(20px)', 
              WebkitBackdropFilter: 'blur(20px)',
              border: '2px solid rgba(200, 162, 77, 0.40)'
            }}>
            <span className="section-label mb-1">Current High Bid</span>
            <div className="text-4xl font-extrabold mb-3 text-[#1D1D1F]" style={{ letterSpacing:'-0.03em' }}>₹{bidAmount.toFixed(2)} Cr</div>
            <div className="text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider" 
              style={{ 
                background: bidderColor ? `${bidderColor}15` : 'rgba(200,162,77,0.10)', 
                border: `1px solid ${bidderColor ? `${bidderColor}30` : 'rgba(200,162,77,0.20)'}`, 
                color: bidderColor || '#C8A24D' 
              }}>
              Held by {bidderName || 'None'}
            </div>
          </div>
        )}
      </div>

      {/* Stats modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background:'rgba(29,29,31,0.30)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}
          onClick={() => setIsModalOpen(false)}>
          <div onClick={e => e.stopPropagation()}
            className="glass-elevated max-w-lg w-full overflow-hidden relative shadow-2xl"
            style={{ borderRadius:'28px', background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.50)' }}>
            <div className="h-1.5" style={{ background:'linear-gradient(90deg,#C8A24D,#E4C26A,#C8A24D)' }} />
            <button onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors"
              style={{ background:'rgba(255,255,255,0.40)', border:'1px solid rgba(0,0,0,0.06)', color:'#1D1D1F' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-7">
              <div className="flex items-start gap-4 mb-6">
                <div className="gold-ring w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" 
                  style={{ background:'rgba(255,255,255,0.50)', borderColor: player.rating >= 87 ? '#C8A24D' : 'rgba(0,0,0,0.06)' }}>
                  {avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
                    <span className="badge-pill badge-dark" style={{ background: '#1D1D1F' }}>OVR {player.rating}</span>
                  </div>
                  <h2 className="text-xl font-bold truncate mb-1 text-[#1D1D1F]" style={{ letterSpacing:'-0.02em' }}>{player.name}</h2>
                  <p className="text-xs font-semibold text-[#55555A]">{player.nationality} · {player.overseas ? 'Overseas Player' : 'Indian Domestic'}</p>
                </div>
              </div>

              <div className="rounded-2xl p-5 mb-6 shadow-sm" style={{ background:'rgba(255,255,255,0.50)', border:'1px solid rgba(255,255,255,0.60)' }}>
                <p className="section-label mb-4">Career Statistics</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <StatRow label="Batting Style" value={player.batting_style} />
                  <StatRow label="Bowling Style" value={player.bowling_style} />
                  <StatRow label="Wicketkeeper" value={player.is_wicketkeeper ? 'Yes' : 'No'} />
                  {player.strike_rate !== undefined && <StatRow label="Strike Rate" value={player.strike_rate} accent="#0A84FF" />}
                  {player.batting_average !== undefined && <StatRow label="Batting Avg" value={player.batting_average} />}
                  {player.wickets !== undefined && <StatRow label="Wickets" value={player.wickets} accent="#30A64A" />}
                  {player.economy !== undefined && <StatRow label="Economy" value={player.economy} accent="#FF453A" />}
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:'1.25rem' }}>
                <div>
                  <span className="section-label block mb-1">Base Draft Price</span>
                  <span className="text-lg font-bold text-[#1D1D1F]">₹{player.base_price.toFixed(2)} Cr</span>
                </div>
                {player.status === 'sold'
                  ? <div className="text-right"><span className="section-label block mb-1">Sold To</span><span className="text-lg font-bold text-[#32D74B]">{teamAcquiring?.name || player.sold_to} · ₹{player.sold_price?.toFixed(2)} Cr</span></div>
                  : player.status === 'unsold'
                  ? <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase" style={{ background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.06)', color:'#8E8E93' }}>Unsold / Passed</span>
                  : <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase" style={{ background:'rgba(50,215,75,0.12)', border:'1px solid rgba(50,215,75,0.25)', color:'#248A3D' }}>Available</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerCard;
