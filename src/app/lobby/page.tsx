'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useAuth } from '../../context/AuthContext';
import { LobbyBackgroundProvider } from '../../components/LobbyBackgroundProvider';
import { Player } from '../../data/players';
import { readPersistedMultiplayerSession, PersistedSession } from '../../utils/persistedMultiplayerSession';

export default function LobbyPage() {
  const router = useRouter();
  const {
    hydrated,
    clientId,
    roomCode,
    clients,
    playerName,
    isHost,
    error,
    teams,
    userTeamId,
    isAuctionStarted,
    createRoom,
    joinRoom,
    selectUserTeam,
    startAuction,
    leaveRoom
  } = useMultiplayer();

  const { user, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [localName, setLocalName] = useState('');
  const [localCode, setLocalCode] = useState('');
  const [persistedSession, setPersistedSession] = useState<PersistedSession | null>(null);
  const [rejoining, setRejoining] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const session = readPersistedMultiplayerSession();
    if (session && session.roomCode) setPersistedSession(session);
  }, [hydrated]);

  useEffect(() => {
    if (user && !localName) setLocalName(user.displayName || 'Player');
  }, [user, localName]);

  useEffect(() => {
    if (roomCode && isAuctionStarted) router.push('/multiplayer-room');
  }, [roomCode, isAuctionStarted, router]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim()) return;
    createRoom(localName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim() || !localCode.trim()) return;
    joinRoom(localCode.trim(), localName.trim());
  };

  const handleRejoin = () => {
    if (!persistedSession) return;
    setRejoining(true);
    const name = persistedSession.playerName || localName || user?.displayName || 'Player';
    joinRoom(persistedSession.roomCode, name, true);
  };

  /* ────────────────────────────────────────────
     SETUP SCREEN (before entering a room)
  ─────────────────────────────────────────────*/
  if (!roomCode) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: '#2B2B2B', color: '#fff' }}
          >
            ⚡ Multiplayer
          </span>
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight"
            style={{ color: '#2B2B2B', letterSpacing: '-0.025em' }}
          >
            Auction Lobby
          </h1>
          <p className="text-sm" style={{ color: '#6B645D' }}>
            Host a room and invite friends with a code, or join an active auction room.
          </p>
        </div>

        {/* Rejoin banner */}
        {persistedSession && !roomCode && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,251,235,0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(253,230,138,0.50)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
                >
                  <svg className="w-4 h-4" style={{ color: '#B45309' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#92400E' }}>
                    Previous Session Found
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
                    Room{' '}
                    <span className="font-mono font-black tracking-widest">
                      {persistedSession.roomCode}
                    </span>
                    {persistedSession.playerName && (
                      <> as <span className="font-bold">{persistedSession.playerName}</span></>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleRejoin}
                  disabled={rejoining}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  {rejoining ? 'Rejoining…' : '↩ Rejoin'}
                </button>
                <button
                  onClick={() => setPersistedSession(null)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div
          className="flex border-b"
          style={{ borderColor: '#E7DFD1' }}
        >
          {(['create', 'join'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer"
              style={{
                borderBottomColor: activeTab === tab ? '#1E1E1E' : 'transparent',
                color: activeTab === tab ? '#1E1E1E' : '#999999',
              }}
            >
              {tab === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="text-xs font-semibold p-3 rounded-xl text-center"
            style={{ background: 'rgba(199,92,92,0.12)', border: '1px solid rgba(199,92,92,0.28)', color: '#C75C5C' }}
          >
            {error}
          </div>
        )}

        {/* Form card */}
        <div
          className="glass-beige-panel"
          style={{ padding: '1.5rem' }}
        >
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="section-label block">Your Name / Host Name</label>
                <input
                  id="create-name-input"
                  type="text"
                  placeholder="e.g. Darshan"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  maxLength={15}
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" id="create-room-btn" className="btn-primary w-full py-3.5 text-sm">
                Create Room &amp; Get Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="section-label block">Your Nickname</label>
                  <input
                    id="join-name-input"
                    type="text"
                    placeholder="e.g. Darshan"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    maxLength={15}
                    required
                    className="form-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label block">6-Digit Room Code</label>
                  <input
                    id="join-code-input"
                    type="text"
                    placeholder="ABC123"
                    value={localCode}
                    onChange={(e) => setLocalCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    className="form-input font-mono font-black text-center tracking-widest text-base"
                  />
                </div>
              </div>
              <button type="submit" id="join-room-btn" className="btn-primary w-full py-3.5 text-sm">
                Join Room
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────
     WAITING ROOM (inside active room)
  ─────────────────────────────────────────────*/
  return (
    <LobbyBackgroundProvider teamId={userTeamId}>
      <div className="py-4 space-y-8">

        {/* Top status bar */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between pb-5 gap-4 border-b"
          style={{ borderColor: '#E7DFD1' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="live-dot" />
              <span className="section-label">Waiting Room</span>
            </div>
            <h1
              className="text-2xl md:text-3xl font-black tracking-tight"
              style={{ color: '#1E1E1E', letterSpacing: '-0.02em' }}
            >
              Room{' '}
              <span
                className="font-mono select-all"
                style={{ color: '#2B2B2B' }}
              >
                {roomCode}
              </span>
            </h1>
            <p className="text-xs mt-1" style={{ color: '#999999' }}>
              Share this 6-digit code with friends to let them join.
            </p>
          </div>

          <button
            onClick={leaveRoom}
            className="btn-secondary px-5 py-2 text-xs self-start md:self-auto"
            style={{ color: '#B91C1C', borderColor: '#FECACA' }}
          >
            Exit Room
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

          {/* LEFT: Connected Players */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-label">Connected Players ({clients.length})</h2>
              <span className="live-dot" />
            </div>

            <div
              style={{
                background: 'rgba(243,238,230,0.60)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.26)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
                borderRadius: '1.25rem',
                padding: '0.75rem',
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {clients.map((c) => {
                const clientTeam = teams.find(t => t.id === c.teamId);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{
                      background: 'rgba(255,252,245,0.50)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.30)',
                    }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(255,252,245,0.60)', border: '1px solid rgba(255,255,255,0.35)', color: '#6B645D' }}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold block" style={{ color: '#2B2B2B' }}>
                          {c.name}{hydrated && c.id === clientId ? ' (You)' : ''}
                        </span>
                        <span className="text-[10px] block uppercase font-medium" style={{ color: '#9C9389' }}>
                          {c.isHost ? '👑 Host' : 'Player'}
                        </span>
                      </div>
                    </div>

                    {clientTeam ? (
                      <div className="flex items-center space-x-1.5">
                        {clientTeam.logoUrl && (
                          <img
                            src={clientTeam.logoUrl}
                            alt={clientTeam.shortName}
                            className="w-6 h-6 object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{
                            background: `${clientTeam.color}18`,
                            border: `1px solid ${clientTeam.color}40`,
                            color: clientTeam.color,
                          }}
                        >
                          {clientTeam.shortName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-medium uppercase" style={{ color: '#BBBBBB' }}>
                        Spectating
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Franchise Selection */}
          <div className="lg:col-span-8 flex flex-col space-y-5">
            <div>
              <h2 className="section-label mb-1">Select Your Franchise</h2>
              <p className="text-xs" style={{ color: '#999999' }}>
                Pick a franchise to manage. Unclaimed franchises will remain inactive.
              </p>
            </div>

            {error && (
              <div
                className="text-xs font-semibold p-2.5 rounded-xl text-center border"
                style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}
              >
                {error}
              </div>
            )}

            {/* Franchise cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(teams ?? []).map((t) => {
                const claimedBy = clients.find(c => c.teamId === t.id);
                const isMine = userTeamId === t.id;
                const isClaimedByOther = claimedBy && !isMine;

                return (
                  <div
                    key={t.id}
                    id={`franchise-card-${t.id}`}
                    onClick={() => !isClaimedByOther && selectUserTeam(isMine ? '' : t.id)}
                    className="relative overflow-hidden rounded-2xl flex flex-col select-none glass-hover"
                    style={{
                      background: isMine
                        ? 'rgba(255,252,245,0.82)'
                        : 'rgba(243,238,230,0.62)',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      border: isMine ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.28)',
                      boxShadow: isMine
                        ? `0 8px 28px ${t.color}28, 0 2px 10px rgba(0,0,0,0.10)`
                        : '0 4px 16px rgba(0,0,0,0.08)',
                      opacity: isClaimedByOther ? 0.40 : 1,
                      cursor: isClaimedByOther ? 'not-allowed' : 'pointer',
                      transform: isMine ? 'translateY(-3px)' : undefined,
                    }}
                  >
                    {/* Team color accent bar */}
                    <div
                      className="h-1 w-full"
                      style={{ background: t.color }}
                    />

                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${t.color}12`,
                            border: `1px solid ${t.color}28`,
                          }}
                        >
                          {t.logoUrl && (
                            <img
                              src={t.logoUrl}
                              alt={t.shortName}
                              className="w-9 h-9 object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="text-xs font-bold uppercase leading-tight line-clamp-2"
                            style={{ color: '#1E1E1E' }}
                          >
                            {t.name}
                          </h3>
                          <span className="text-[10px] font-medium" style={{ color: '#999999' }}>
                            ₹120 Cr Purse
                          </span>
                        </div>
                      </div>

                      <div
                        className="pt-2.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}
                      >
                        {isMine ? (
                          <span style={{ color: '#5E9F73' }}>✓ Claimed By You</span>
                        ) : isClaimedByOther ? (
                          <span style={{ color: '#C75C5C' }} className="truncate block">
                            Taken by {claimedBy?.name}
                          </span>
                        ) : (
                          <span style={{ color: '#C4BDB5' }}>Available</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Start / Waiting area */}
            <div
              className="pt-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}
            >
              {isHost ? (
                <div className="space-y-2 max-w-sm">
                  <button
                    id="start-auction-btn"
                    onClick={startAuction}
                    disabled={!userTeamId}
                    className="btn-primary w-full py-3.5 text-sm"
                  >
                    Start Multiplayer Auction →
                  </button>
                  {!userTeamId && (
                    <p className="text-[10px] font-semibold" style={{ color: '#B91C1C' }}>
                      Select a franchise before starting.
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
                  style={{
                    background: 'rgba(243,238,230,0.60)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: '#6B645D',
                  }}
                >
                  <span className="live-dot" />
                  <span>
                    Waiting for {clients.find(c => c.isHost)?.name || 'Host'} to start the auction…
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LobbyBackgroundProvider>
  );
}
