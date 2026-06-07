'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player, initialPlayers } from '../data/players';

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
      <span className="stat-chip__value" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="glass glass-hover relative overflow-hidden cursor-pointer group"
        style={{ borderRadius: '24px' }}
      >
        {/* Avatar plate */}
        <div
          className="h-52 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}
        >
          {/* Gold ring avatar frame */}
          <div
            className="gold-ring w-36 h-36 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {avatar}
          </div>

          {/* OVR */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(29,29,31,0.70)', backdropFilter: 'blur(16px)', color: '#fff', border: '1px solid rgba(255,255,255,0.10)' }}>
            <span className="opacity-60 text-[9px]">OVR</span>
            <span>{player.rating}</span>
          </div>

          {/* Nationality */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-medium"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)', color: '#6E6E73' }}>
            {player.nationality}{player.overseas ? ' ✈' : ''}
          </div>
        </div>

        {/* Info */}
        <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
            {player.is_wicketkeeper && <span className="badge-pill badge-role-wk">WK</span>}
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            {getFlagUrl(player.nationality) && (
              <img src={getFlagUrl(player.nationality)} alt={player.nationality}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
              />
            )}
            <h3 className="text-[15px] font-semibold truncate" style={{ color:'#1D1D1F', letterSpacing:'-0.01em' }}>{player.name}</h3>
          </div>

          <p className="text-xs mb-4 truncate" style={{ color:'#9A9AA0' }}>{player.batting_style} · {player.bowling_style}</p>

          <div className="flex items-center justify-between pt-3.5" style={{ borderTop:'1px solid rgba(255,255,255,0.10)' }}>
            <div>
              <span className="block text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color:'#9A9AA0' }}>Base Price</span>
              <span className="text-[15px] font-semibold" style={{ color:'#1D1D1F' }}>₹{player.base_price.toFixed(2)} Cr</span>
            </div>
            {player.status === 'sold' ? (
              <div className="text-right">
                <span className="block text-[9px] font-semibold uppercase" style={{ color:'#32D74B' }}>Sold</span>
                <span className="text-[15px] font-bold" style={{ color:'#1D1D1F' }}>₹{player.sold_price?.toFixed(2)} Cr</span>
              </div>
            ) : player.status === 'unsold' ? (
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', color:'#9A9AA0' }}>Unsold</span>
            ) : (
              <span className="text-xs font-medium" style={{ color:'#C8A24D' }}>View stats →</span>
            )}
          </div>
        </div>

        {/* Bid overlay */}
        {showBidOverlay && bidAmount !== undefined && bidAmount > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 rounded-3xl"
            style={{ background:'rgba(245,240,232,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
            <span className="section-label mb-1.5">Current High Bid</span>
            <div className="text-4xl font-bold mb-3" style={{ color:'#1D1D1F', letterSpacing:'-0.03em' }}>₹{bidAmount.toFixed(2)} Cr</div>
            <div className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: bidderColor ? `${bidderColor}18` : 'rgba(200,162,77,0.12)', border:`1px solid ${bidderColor ? `${bidderColor}35` : 'rgba(200,162,77,0.25)'}`, color: bidderColor || '#9A7430' }}>
              Held by {bidderName || 'None'}
            </div>
          </div>
        )}
      </div>

      {/* Stats modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background:'rgba(29,29,31,0.40)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}
          onClick={() => setIsModalOpen(false)}>
          <div onClick={e => e.stopPropagation()}
            className="glass-elevated max-w-lg w-full overflow-hidden relative"
            style={{ borderRadius:'28px' }}>
            <div className="h-1" style={{ background:'linear-gradient(90deg,#C8A24D,#E4C26A,#C8A24D)' }} />
            <button onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full"
              style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', color:'#6E6E73' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-7">
              <div className="flex items-start gap-4 mb-7">
                <div className="gold-ring w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:'rgba(255,255,255,0.04)' }}>
                  {avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
                    <span className="badge-pill badge-dark">OVR {player.rating}</span>
                  </div>
                  <h2 className="text-xl font-semibold truncate mb-1" style={{ color:'#1D1D1F', letterSpacing:'-0.02em' }}>{player.name}</h2>
                  <p className="text-xs" style={{ color:'#9A9AA0' }}>{player.nationality} · {player.overseas ? 'Overseas' : 'Indian Domestic'}</p>
                </div>
              </div>

              <div className="rounded-2xl p-5 mb-6" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)' }}>
                <p className="section-label mb-4">Career Statistics</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <StatRow label="Batting Style" value={player.batting_style} />
                  <StatRow label="Bowling Style" value={player.bowling_style} />
                  <StatRow label="Wicketkeeper" value={player.is_wicketkeeper ? 'Yes' : 'No'} />
                  {player.strike_rate !== undefined && <StatRow label="Strike Rate" value={player.strike_rate} accent="#0A84FF" />}
                  {player.batting_average !== undefined && <StatRow label="Batting Avg" value={player.batting_average} />}
                  {player.wickets !== undefined && <StatRow label="Wickets" value={player.wickets} accent="#32D74B" />}
                  {player.economy !== undefined && <StatRow label="Economy" value={player.economy} accent="#FF453A" />}
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ borderTop:'1px solid rgba(255,255,255,0.10)', paddingTop:'1.25rem' }}>
                <div>
                  <span className="section-label block mb-1">Base Draft Price</span>
                  <span className="text-lg font-semibold" style={{ color:'#1D1D1F' }}>₹{player.base_price.toFixed(2)} Cr</span>
                </div>
                {player.status === 'sold'
                  ? <div className="text-right"><span className="section-label block mb-1">Sold To</span><span className="text-lg font-bold" style={{ color:'#32D74B' }}>{player.sold_to?.replace('team_','').toUpperCase()} · ₹{player.sold_price?.toFixed(2)} Cr</span></div>
                  : player.status === 'unsold'
                  ? <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', color:'#9A9AA0' }}>Unsold / Passed</span>
                  : <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background:'rgba(50,215,75,0.08)', border:'1px solid rgba(50,215,75,0.20)', color:'#248A3D' }}>Available</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerCard;
