'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player, initialPlayers } from '../data/players';

const playerImageMap: Record<string, string> = {};
initialPlayers.forEach(p => {
  if (p.image) {
    playerImageMap[p.id] = p.image;
    playerImageMap[p.name.toLowerCase().trim()] = p.image;
  }
});

const getFlagUrl = (nationality: string): string => {
  const norm = nationality.trim().toLowerCase();
  if (norm === 'west indies') return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/West_Indies_Cricket_Flag_SVG.svg/40px-West_Indies_Cricket_Flag_SVG.svg.png';
  const mapping: Record<string, string> = {
    india:'in',australia:'au','south africa':'za',england:'gb-eng','new zealand':'nz',
    'sri lanka':'lk',srilanka:'lk',afghanistan:'af',bangladesh:'bd',ireland:'ie',
    zimbabwe:'zw',usa:'us',nepal:'np',netherlands:'nl',scotland:'gb-sct',
  };
  const code = mapping[norm];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

interface RoleStyle { label: string; badgeClass: string; avatarColor: string; }

const roleStyles: Record<string, RoleStyle> = {
  opener:           { label:'Opener',          badgeClass:'badge-role-opener',          avatarColor:'#B91C1C' },
  middle_order:     { label:'Middle Order',     badgeClass:'badge-role-middle_order',    avatarColor:'#B45309' },
  finisher:         { label:'Finisher',         badgeClass:'badge-role-finisher',        avatarColor:'#6D28D9' },
  spinner:          { label:'Spinner',          badgeClass:'badge-role-spinner',         avatarColor:'#065F46' },
  death_bowler:     { label:'Death Bowler',     badgeClass:'badge-role-death_bowler',    avatarColor:'#1D4ED8' },
  powerplay_bowler: { label:'Powerplay Bowler', badgeClass:'badge-role-powerplay_bowler',avatarColor:'#0E7490' },
  all_rounder:      { label:'All Rounder',      badgeClass:'badge-role-all_rounder',     avatarColor:'#C2410C' },
};

interface PlayerCardProps {
  player: Player;
  showBidOverlay?: boolean;
  bidAmount?: number;
  bidderName?: string;
  bidderColor?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player, showBidOverlay = false, bidAmount, bidderName, bidderColor,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError]   = useState(false);

  useEffect(() => { setImageError(false); }, [player.id, player.image]);

  const style = roleStyles[player.role] || { label: player.role, badgeClass: '', avatarColor: '#6B645D' };
  const resolvedImage = player.image || playerImageMap[player.id] || playerImageMap[player.name.toLowerCase().trim()] || '';

  /* ── Avatar ── */
  const avatar = useMemo(() => {
    if (resolvedImage && !imageError) {
      return (
        <img
          src={resolvedImage}
          alt={player.name}
          className="w-[93%] h-[93%] object-contain z-10 relative pointer-events-none"
          onError={() => setImageError(true)}
        />
      );
    }
    const c = style.avatarColor;
    let pathMarkup = null;
    if (['opener','middle_order','finisher'].includes(player.role)) {
      pathMarkup = <path d="M25,65 L35,50 L40,30 L45,20 L50,12 M45,20 L55,22 L65,30 L60,40 M40,30 L30,35 L20,40 M60,40 L68,60 L78,65 M68,60 L62,56 M20,40 L8,24" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    } else if (player.role === 'all_rounder') {
      pathMarkup = <><circle cx="28" cy="22" r="5" fill={c} opacity="0.6" /><path d="M38,65 L43,45 L45,25 L50,15 M45,25 L55,26 L62,35 L58,45 M30,32 L20,38 L12,25 M58,45 L64,62 L74,66 M20,38 L30,42" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>;
    } else {
      pathMarkup = <path d="M32,65 L36,52 L40,35 L42,22 L45,15 M40,35 L55,25 L65,12 L50,8 M36,52 L25,48 L15,35 M55,25 L62,45 L70,62 L78,65" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    }
    return (
      <svg viewBox="0 0 100 80" className="w-full h-full opacity-70">
        <ellipse cx="50" cy="72" rx="30" ry="5" fill="rgba(201,162,39,0.15)" />
        <circle cx="45" cy="12" r="4" fill={c} opacity="0.7" />
        {pathMarkup}
      </svg>
    );
  }, [player.id, player.role, resolvedImage, imageError, style.avatarColor]);

  const StatRow = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <div className="stat-chip">
      <span className="stat-chip__label">{label}</span>
      <span className="stat-chip__value" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );

  return (
    <>
      {/* ── Card ── */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="glass-beige surface-card-hover relative overflow-hidden cursor-pointer group"
        style={{ borderRadius: '1.5rem' }}
      >
        {/* Avatar plate — glass beige with gold ring */}
        <div
          className="h-52 flex items-center justify-center p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,252,245,0.55) 0%, rgba(239,231,220,0.45) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Gold ring frame around avatar */}
          <div
            className="gold-ring w-36 h-36 rounded-full flex items-center justify-center overflow-hidden relative"
            style={{ background: 'rgba(255,252,245,0.40)' }}
          >
            {avatar}
          </div>

          {/* OVR badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(43,43,43,0.85)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
            }}
          >
            <span className="text-[9px] font-medium opacity-70">OVR</span>
            <span>{player.rating}</span>
          </div>

          {/* Nationality badge */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium"
            style={{
              background: 'rgba(255,252,245,0.70)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.40)',
              color: '#6B645D',
            }}
          >
            <span>{player.nationality}</span>
            {player.overseas && <span className="font-bold" style={{ color: '#1D4ED8' }}>✈</span>}
          </div>
        </div>

        {/* Info */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.25)' }}
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
            {player.is_wicketkeeper && <span className="badge-pill badge-role-wk">WK</span>}
          </div>

          <div className="flex items-center gap-2 min-w-0 mb-1">
            {getFlagUrl(player.nationality) && (
              <img
                src={getFlagUrl(player.nationality)} alt={player.nationality}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.35)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <h3 className="text-sm font-bold truncate" style={{ color: '#2B2B2B' }}>
              {player.name}
            </h3>
          </div>

          <div className="flex justify-between text-[10px] mb-3" style={{ color: '#9C9389' }}>
            <span className="truncate">{player.batting_style}</span>
            <span className="truncate max-w-[50%] text-right">{player.bowling_style}</span>
          </div>

          <div
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <div>
              <span className="block text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#9C9389' }}>Base Price</span>
              <span className="text-sm font-bold" style={{ color: '#2B2B2B' }}>₹{player.base_price.toFixed(2)} Cr</span>
            </div>
            {player.status === 'sold' ? (
              <div className="text-right">
                <span className="block text-[9px] font-bold uppercase" style={{ color: '#5E9F73' }}>Sold</span>
                <span className="text-sm font-black" style={{ color: '#2B2B2B' }}>₹{player.sold_price?.toFixed(2)} Cr</span>
              </div>
            ) : player.status === 'unsold' ? (
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(156,147,137,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#9C9389' }}
              >
                Unsold
              </span>
            ) : (
              <span className="text-xs font-medium" style={{ color: '#6B645D' }}>Stats →</span>
            )}
          </div>
        </div>

        {/* Live bid overlay */}
        {showBidOverlay && bidAmount !== undefined && bidAmount > 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20"
            style={{
              background: 'rgba(243,238,230,0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <span className="section-label mb-1">Current High Bid</span>
            <div className="text-3xl font-black mb-2" style={{ color: '#2B2B2B' }}>
              ₹{bidAmount.toFixed(2)} Cr
            </div>
            <div
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: bidderColor ? `${bidderColor}18` : 'rgba(201,162,39,0.12)',
                border: `1px solid ${bidderColor ? `${bidderColor}40` : 'rgba(201,162,39,0.30)'}`,
                color: bidderColor || '#8B6914',
              }}
            >
              Held by {bidderName || 'None'}
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(43,43,43,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-beige-panel max-w-lg w-full overflow-hidden relative"
          >
            {/* Gold accent bar */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #C9A227, #E8C84A, #C9A227)' }} />

            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
              style={{ background: 'rgba(255,252,245,0.60)', border: '1px solid rgba(255,255,255,0.35)', color: '#6B645D' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                {/* Gold-ringed avatar */}
                <div
                  className="gold-ring w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: 'rgba(255,252,245,0.50)' }}
                >
                  {avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className={`badge-pill ${style.badgeClass}`}>{style.label}</span>
                    <span className="badge-pill badge-dark">OVR {player.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {getFlagUrl(player.nationality) && (
                      <img
                        src={getFlagUrl(player.nationality)} alt={player.nationality}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.35)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <h2 className="text-xl font-black truncate" style={{ color: '#2B2B2B' }}>{player.name}</h2>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#9C9389' }}>
                    {player.nationality} · {player.overseas ? 'Overseas' : 'Indian Domestic'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div
                className="rounded-2xl p-4 mb-5"
                style={{ background: 'rgba(239,231,220,0.55)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <h4 className="section-label mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
                  Career Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatRow label="Batting Style" value={player.batting_style} />
                  <StatRow label="Bowling Style" value={player.bowling_style} />
                  <StatRow label="Wicketkeeper" value={player.is_wicketkeeper ? 'Yes' : 'No'} />
                  {player.strike_rate !== undefined && <StatRow label="Strike Rate" value={player.strike_rate} accent="#1D4ED8" />}
                  {player.batting_average !== undefined && <StatRow label="Batting Avg" value={player.batting_average} />}
                  {player.wickets !== undefined && <StatRow label="Wickets" value={player.wickets} accent="#065F46" />}
                  {player.economy !== undefined && <StatRow label="Economy" value={player.economy} accent="#C75C5C" />}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
                <div>
                  <span className="block section-label mb-0.5">Base Draft Price</span>
                  <span className="text-base font-bold" style={{ color: '#2B2B2B' }}>₹{player.base_price.toFixed(2)} Cr</span>
                </div>
                {player.status === 'sold' ? (
                  <div className="text-right">
                    <span className="block section-label mb-0.5">Sold To</span>
                    <span className="text-base font-black" style={{ color: '#5E9F73' }}>
                      {player.sold_to?.replace('team_', '').toUpperCase()} · ₹{player.sold_price?.toFixed(2)} Cr
                    </span>
                  </div>
                ) : player.status === 'unsold' ? (
                  <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-full" style={{ background: 'rgba(156,147,137,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#9C9389' }}>
                    Unsold / Passed
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-full" style={{ background: 'rgba(94,159,115,0.14)', border: '1px solid rgba(94,159,115,0.30)', color: '#3D7A55' }}>
                    Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerCard;
