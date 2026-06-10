'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Player, initialPlayers } from '../data/players';
import { initialTeams } from '../data/teams';

const playerImageMap: Record<string, string> = {};
initialPlayers.forEach(p => {
  if (p.image) {
    playerImageMap[p.id] = p.image;
    playerImageMap[p.name.toLowerCase().trim()] = p.image;
  }
});

const getFlagUrl = (nat: string) => {
  const n = nat.trim().toLowerCase();
  if (n === 'west indies') return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/West_Indies_Cricket_Flag_SVG.svg/40px-West_Indies_Cricket_Flag_SVG.svg.png';
  const map: Record<string, string> = {
    india: 'in', australia: 'au', 'south africa': 'za', england: 'gb-eng', 'new zealand': 'nz',
    'sri lanka': 'lk', srilanka: 'lk', afghanistan: 'af', bangladesh: 'bd', ireland: 'ie',
    zimbabwe: 'zw', usa: 'us', nepal: 'np', netherlands: 'nl', scotland: 'gb-sct'
  };
  const code = map[n];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

// Precise color maps for pills on warm cream backdrop - Elegant Apple-inspired colors
const rolePillStyles: Record<string, { label: string; text: string; bg: string; border: string }> = {
  opener:           { label: 'Opener',            text: '#A85A18', bg: 'rgba(212, 140, 60, 0.12)',  border: 'rgba(212, 140, 60, 0.28)'  },
  middle_order:     { label: 'Middle Order',      text: '#78593E', bg: 'rgba(140, 105, 74, 0.12)',  border: 'rgba(140, 105, 74, 0.28)'  },
  finisher:         { label: 'Finisher',          text: '#8F6E3C', bg: 'rgba(200, 150, 80, 0.12)', border: 'rgba(200, 150, 80, 0.28)' },
  spinner:          { label: 'Spinner',           text: '#6D5E4E', bg: 'rgba(160, 140, 110, 0.12)',  border: 'rgba(160, 140, 110, 0.28)'  },
  death_bowler:     { label: 'Death Bowler',      text: '#5B4632', bg: 'rgba(110, 85, 58, 0.12)',  border: 'rgba(110, 85, 58, 0.28)'  },
  powerplay_bowler: { label: 'Powerplay Bowler',  text: '#7D654E', bg: 'rgba(180, 150, 120, 0.12)',  border: 'rgba(180, 150, 120, 0.28)'  },
  all_rounder:      { label: 'All Rounder',       text: '#A37544', bg: 'rgba(200, 149, 90, 0.12)',  border: 'rgba(200, 149, 90, 0.28)'  },
};

const defaultRoleColor = 'rgba(110, 85, 50, 0.70)';

interface PlayerCardProps {
  player: Player;
  showBidOverlay?: boolean;
  bidAmount?: number;
  bidderName?: string;
  bidderColor?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, showBidOverlay = false, bidAmount, bidderName, bidderColor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [player.id, player.image]);

  const resolvedImage = player.image || playerImageMap[player.id] || playerImageMap[player.name.toLowerCase().trim()] || '';
  const teamAcquiring = player.sold_to ? initialTeams.find(t => t.id === player.sold_to) : null;

  const roleStyle = rolePillStyles[player.role] || {
    label: player.role.replace('_', ' '),
    text: '#4E3C24',
    bg: 'rgba(0, 0, 0, 0.05)',
    border: 'rgba(0, 0, 0, 0.10)'
  };

  const StatRow = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '8px 10px',
        background: 'rgba(78, 60, 36, 0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(78, 60, 36, 0.05)',
      }}
    >
      <span style={{ fontSize: '8.5px', fontWeight: 600, color: '#6D5E4E', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: accent || '#4E3C24' }}>{value}</span>
    </div>
  );

  return (
    <>
      {/* ── CARD ── */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="relative overflow-hidden cursor-pointer group flex flex-col w-full"
        style={{
          borderRadius: '28px',
          background: 'rgba(255, 248, 235, 0.35)', // Translucent warm cream liquid glass
          backdropFilter: 'blur(30px) saturate(1.9)', // Strong backdrop blur & saturation
          WebkitBackdropFilter: 'blur(30px) saturate(1.9)',
          border: '1px solid rgba(255, 255, 255, 0.45)', // Highlights refraction edge
          boxShadow: '0 8px 32px rgba(138, 106, 58, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.50)', // Subtle top specularity
          transition: 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.28s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.28s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 248, 235, 0.48)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(138, 106, 58, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.60)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 248, 235, 0.35)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(138, 106, 58, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.50)';
        }}
      >
        {/* ── TOP HEADER (Badges & Circle Avatar) ── */}
        <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Badge Row */}
          <div className="flex items-center justify-between w-full" style={{ minHeight: '26px' }}>
            {/* OVR capsule */}
            <div
              style={{
                background: 'rgba(78, 60, 36, 0.78)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '3px 10px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' }}>OVR</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>{player.rating}</span>
            </div>

            {/* Right Pills */}
            <div className="flex items-center gap-1.5">
              {player.rating >= 90 && (
                <span
                  style={{
                    background: 'rgba(212, 150, 58, 0.08)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#8F6E3C',
                    border: '1.2px solid rgba(212, 150, 58, 0.22)',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2.5px 8.5px',
                    borderRadius: '999px',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Legend
                </span>
              )}
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.40)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#4E3C24',
                  fontSize: '9.5px',
                  fontWeight: 650,
                  padding: '2.5px 8.5px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3.5px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {player.nationality}
                {player.overseas && (
                  <span style={{ fontSize: '10px', color: '#8F6E3C', marginLeft: '1px', lineHeight: 1 }}>✈</span>
                )}
              </span>
            </div>
          </div>

          {/* Centered Circular Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 6px' }}>
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'transparent',
                position: 'relative',
                boxShadow: '0 4px 16px rgba(138, 106, 58, 0.14)',
              }}
            >
              {resolvedImage && !imageError ? (
                <img
                  src={resolvedImage}
                  alt={player.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.28]"
                  style={{
                    transform: 'scale(1.22)',
                    transformOrigin: 'center center',
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${defaultRoleColor} 0%, #E6E0D5 100%)` }}
                >
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', userSelect: 'none' }}>
                    {player.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CARD CONTENT (Bottom half) ── */}
        <div style={{ padding: '8px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            {/* Role Badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '2px 8.5px',
                  borderRadius: '999px',
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  border: `1px solid ${roleStyle.border}`,
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                {roleStyle.label}
              </span>
              {player.is_wicketkeeper && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '2px 8.5px',
                    borderRadius: '999px',
                    background: 'rgba(200, 169, 110, 0.12)',
                    color: '#8F6E3C',
                    border: '1px solid rgba(200, 169, 110, 0.30)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                  }}
                >
                  WK
                </span>
              )}
            </div>

            {/* Name with Flag row */}
            <div className="flex items-center gap-2 mb-1.5">
              {getFlagUrl(player.nationality) && (
                <img
                  src={getFlagUrl(player.nationality)}
                  alt={player.nationality}
                  className="w-5.5 h-5.5 rounded-full object-cover flex-shrink-0"
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 750,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                  color: '#1C1410',
                  margin: 0,
                }}
              >
                {player.name}
              </h3>
            </div>

            {/* Player details info */}
            <p style={{ fontSize: '13px', color: '#4A3E31', margin: 0, fontWeight: 500 }} className="truncate">
              {player.batting_style}
              {player.bowling_style && player.bowling_style !== 'N/A' ? ` · ${player.bowling_style.split(' ').slice(-1)[0]}` : ''}
            </p>
          </div>

          {/* Hairline Divider */}
          <div style={{ height: '0.5px', background: 'rgba(0, 0, 0, 0.08)', margin: '4px 0' }} />

          {/* Pricing / Action Area */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '8.5px', fontWeight: 600, color: '#6D5E4E', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 1px' }}>Base Price</p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1C1410', margin: 0 }}>₹{player.base_price.toFixed(2)} Cr</p>
            </div>

            {player.status === 'sold' && teamAcquiring ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '8.5px', fontWeight: 700, color: teamAcquiring.color, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 1px' }}>{teamAcquiring.shortName}</p>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1C1410', margin: 0 }}>₹{player.sold_price?.toFixed(2)} Cr</p>
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: '#FAF6EE', border: '1px solid rgba(0, 0, 0, 0.08)', padding: '3px', flexShrink: 0 }}>
                  <img src={teamAcquiring.logoUrl} alt={teamAcquiring.shortName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            ) : player.status === 'sold' ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '8.5px', fontWeight: 700, color: '#C8955A', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 1px' }}>Signed</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#1C1410', margin: 0 }}>₹{player.sold_price?.toFixed(2)} Cr</p>
              </div>
            ) : player.status === 'unsold' ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 650,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  color: '#6D5E4E',
                }}
              >
                Unsold
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#8F6E3C', transition: 'transform 0.15s ease' }} className="group-hover:translate-x-0.5">
                View stats →
              </span>
            )}
          </div>
        </div>

        {/* Bid overlay */}
        {showBidOverlay && bidAmount !== undefined && bidAmount > 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20"
            style={{ background: 'rgba(250, 246, 238, 0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6D5E4E', margin: '0 0 6px' }}>Current High Bid</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1C1410', letterSpacing: '-0.04em', margin: '0 0 12px' }}>₹{bidAmount.toFixed(2)} Cr</p>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '999px',
              background: bidderColor ? `${bidderColor}18` : 'rgba(212,150,58,0.12)',
              border: `1px solid ${bidderColor || 'rgba(212,150,58,0.30)'}`,
              color: bidderColor || '#D4963A',
            }}>{bidderName || 'None'}</span>
          </div>
        )}
      </div>

      {/* ── STATS MODAL ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(28, 20, 10, 0.45)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              borderRadius: '28px',
              overflow: 'hidden',
              background: 'rgba(255, 248, 235, 0.50)', // Translucent warm liquid glass
              backdropFilter: 'blur(40px) saturate(2.0)',
              WebkitBackdropFilter: 'blur(40px) saturate(2.0)',
              border: '1px solid rgba(255, 255, 255, 0.55)', // Solid glass reflection highlight edge
              boxShadow: '0 30px 80px rgba(78, 60, 36, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.60)',
            }}
          >
            {/* Modal Header */}
            <div style={{ position: 'relative', padding: '24px 24px 16px', background: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)',
                  color: '#4E3C24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>

              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
                    background: 'transparent', flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(138, 106, 58, 0.12)',
                    position: 'relative',
                  }}
                >
                  {resolvedImage && !imageError ? (
                    <img
                      src={resolvedImage}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      style={{
                        transform: 'scale(1.22)',
                        transformOrigin: 'center center',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${defaultRoleColor} 0%, #EAE5DB 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                        {player.name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '2.5px 8.5px',
                        borderRadius: '999px',
                        background: roleStyle.bg,
                        color: roleStyle.text,
                        border: `1px solid ${roleStyle.border}`,
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                      }}
                    >
                      {roleStyle.label}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(78, 60, 36, 0.10)',
                      color: '#4E3C24',
                      border: '1px solid rgba(78, 60, 36, 0.18)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                    }}>
                      OVR {player.rating}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1C1410', margin: 0, letterSpacing: '-0.025em' }}>{player.name}</h2>
                  <p style={{ fontSize: '12px', color: '#4A3E31', margin: '2px 0 0' }}>{player.nationality} · {player.overseas ? 'Overseas' : 'Domestic'}</p>
                </div>
              </div>
            </div>

            {/* Career stats */}
            <div style={{ padding: '20px 20px 0' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#6D5E4E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Career Statistics</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatRow label="Batting Style" value={player.batting_style} />
                <StatRow label="Bowling Style" value={player.bowling_style} />
                <StatRow label="Wicketkeeper" value={player.is_wicketkeeper ? 'Yes' : 'No'} />
                {player.runs !== undefined && <StatRow label="Runs" value={player.runs} />}
                {player.strike_rate !== undefined && <StatRow label="Strike Rate" value={player.strike_rate} accent="#A88558" />}
                {player.batting_average !== undefined && <StatRow label="Batting Avg" value={player.batting_average} />}
                {player.wickets !== undefined && <StatRow label="Wickets" value={player.wickets} accent="#8C7355" />}
                {player.economy !== undefined && <StatRow label="Economy" value={player.economy} accent="#B38F5B" />}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(0,0,0,0.06)', marginTop: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#6D5E4E', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 2px' }}>Base Draft Price</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#C8955A', margin: 0, letterSpacing: '-0.025em' }}>₹{player.base_price.toFixed(2)} Cr</p>
              </div>
              {player.status === 'sold' && teamAcquiring ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: teamAcquiring.color, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 2px' }}>Sold To</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1410', margin: 0 }}>{teamAcquiring.name}</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#4A3E31', margin: 0 }}>₹{player.sold_price?.toFixed(2)} Cr</p>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', padding: '4px' }}>
                    <img src={teamAcquiring.logoUrl} alt={teamAcquiring.shortName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              ) : player.status === 'unsold' ? (
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '999px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#4A3E31' }}>Passed</span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '999px', background: 'rgba(200, 169, 110, 0.08)', border: '1px solid rgba(200, 169, 110, 0.18)', color: '#C8A96E' }}>Available</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerCard;
