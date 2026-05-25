'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useAuth } from '../../context/AuthContext';
import { LobbyBackgroundProvider } from '../../components/LobbyBackgroundProvider';
import { Player } from '../../data/players';
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

  useEffect(() => {
    if (user && !localName) {
      setLocalName(user.displayName || 'Player');
    }
  }, [user, localName]);

  // Redirect to room if started
  useEffect(() => {
    if (roomCode && isAuctionStarted) {
      router.push('/multiplayer-room');
    }
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



  // Render Lobby Setup Screen (Before entering room)
  if (!roomCode) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest font-extrabold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3.5 py-1.5 rounded-full inline-block">
            ⚡ Play with Friends
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none bg-gradient-to-r from-[#F8FAFC] via-[#94A3B8] to-[#F8FAFC] bg-clip-text text-transparent">
            Multiplayer Room Lobby
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] max-w-lg mx-auto font-medium">
            Host a room to invite your friends using a room code, or enter an active room code to join their auction live.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-white/5 justify-center space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8]/60 hover:text-[#F8FAFC]'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'join'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8]/60 hover:text-[#F8FAFC]'
            }`}
          >
            Join Room
          </button>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl relative bg-[#0F172A]/40 backdrop-blur-md">
          {!user ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Sign in to play</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Authentication ensures you can seamlessly rejoin your session if you get disconnected.
                </p>
              </div>
              <button
                onClick={loginWithGoogle}
                className="w-full max-w-sm mx-auto py-4 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-[0_4px_25px_rgba(37,99,235,0.3)] transition active:scale-98 cursor-pointer flex items-center justify-center gap-3"
              >
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-extrabold text-[#94A3B8]/60">
                  Your Nickname / Host Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Nickname..."
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  maxLength={15}
                  required
                  className="w-full bg-[#030810]/60 border border-white/5 focus:border-[#38BDF8] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/30 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-[0_4px_25px_rgba(37,99,235,0.3)] transition active:scale-98 cursor-pointer"
              >
                Create Room & Get Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Nickname..."
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    maxLength={15}
                    required
                    className="w-full bg-slate-900/60 border border-white/5 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400">
                    6-Digit Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Code..."
                    value={localCode}
                    onChange={(e) => setLocalCode(e.target.value)}
                    maxLength={6}
                    required
                    className="w-full bg-slate-900/60 border border-white/5 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors tracking-widest font-black text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-[0_4px_25px_rgba(37,99,235,0.3)] transition active:scale-98 cursor-pointer"
              >
                Join Friends' Room
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Lobby Waiting Room Screen (Inside active room)
  return (
    <LobbyBackgroundProvider teamId={userTeamId}>
      <div className="py-6 space-y-8 animate-fade-in">
      {/* Top Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-5 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-widest px-2.5 py-1 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-md inline-block mb-1.5 animate-pulse">
            Waiting Room Lobby
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#F8FAFC] uppercase tracking-tight">
            Room Code: <span className="text-[#38BDF8] font-mono tracking-widest select-all">{roomCode}</span>
          </h1>
          <p className="text-xs text-[#94A3B8]/60 mt-1 font-semibold">
            Share this 6-digit room code with your friends so they can join.
          </p>
        </div>

        <button
          onClick={leaveRoom}
          className="px-5 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:text-[#F8FAFC] hover:bg-red-500/10 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
        >
          Exit Room
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* LEFT PANEL: Connected Players List (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col">
          <h2 className="text-xs uppercase tracking-widest font-black text-[#94A3B8]/60 mb-3 flex items-center justify-between">
            <span>Connected Players ({clients.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </h2>
          
          <div className="glass-card rounded-2xl border border-white/5 p-4 space-y-3 flex-grow overflow-y-auto max-h-[350px] bg-[#07111F]/30">
            {clients.map((c) => {
              const clientTeam = teams.find(t => t.id === c.teamId);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#030810]/40 border border-white/5"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#030810]/80 border border-white/5 flex items-center justify-center text-xs font-black text-[#94A3B8]/60">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-[#F8FAFC] block">
                        {c.name}{hydrated && c.id === clientId ? ' (You)' : ''}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]/50 block uppercase font-semibold">
                        {c.isHost ? '👑 Host / Auctioneer' : 'Player'}
                      </span>
                    </div>
                  </div>

                  {clientTeam ? (
                    <div className="flex items-center space-x-1.5">
                      {clientTeam.logoUrl && (
                        <img
                          src={clientTeam.logoUrl}
                          alt={clientTeam.shortName}
                          className="w-6 h-6 object-contain drop-shadow"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span
                        className="text-[9px] font-black px-2 py-1 rounded uppercase shadow-sm"
                        style={{ backgroundColor: `${clientTeam.color}20`, border: `1px solid ${clientTeam.color}50`, color: clientTeam.color }}
                      >
                        {clientTeam.shortName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-[#94A3B8]/40 uppercase tracking-wider">Spectating</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Team Claiming Board (Col Span 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-black text-[#94A3B8]/60 mb-1">
              Select Your Franchise
            </h2>
            <p className="text-[11px] text-[#94A3B8] font-semibold">
              Pick a franchise to manage during the draft. Unclaimed franchises will remain inactive.
            </p>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {(teams ?? []).map((t) => {
              const claimedBy = clients.find(c => c.teamId === t.id);
              const isMine = userTeamId === t.id;
              const isClaimedByOther = claimedBy && !isMine;

              return (
                <div
                  key={t.id}
                  onClick={() => !isClaimedByOther && selectUserTeam(isMine ? '' : t.id)}
                  className={`glass-card p-4 rounded-xl border relative overflow-hidden group select-none flex flex-col justify-between transition-all duration-300 ${
                    isMine
                      ? 'ring-1 scale-102 bg-[#07111F]/80 backdrop-blur-md'
                      : isClaimedByOther
                      ? 'bg-white/2 border-white/5 opacity-30 cursor-not-allowed'
                      : 'bg-white/4 hover:bg-white/8 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                  style={{
                    boxShadow: isMine ? `0 4px 15px ${t.color}25` : undefined,
                    borderWidth: '1px',
                    borderColor: isMine ? t.color : 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-[2px]"
                    style={{ backgroundColor: t.color }}
                  ></div>

                  <div className="flex items-center space-x-2.5 mb-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative flex-shrink-0"
                      style={{
                        backgroundColor: `${t.color}15`,
                        border: `1px solid ${t.color}30`,
                      }}
                    >
                      {t.logoUrl ? (
                        <img
                          src={t.logoUrl}
                          alt={t.shortName}
                          className="w-10 h-10 object-contain drop-shadow"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            if (el.nextSibling) (el.nextSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xs font-black hidden items-center justify-center w-full h-full"
                        style={{ color: t.color }}
                      >
                        {t.shortName}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors uppercase leading-tight line-clamp-2">
                        {t.name}
                      </h3>
                      <span className="text-[9px] text-[#94A3B8]/60 uppercase tracking-wider block mt-1 font-semibold">
                        120.0 Cr Purse
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2 text-[9px] uppercase tracking-wider text-[#94A3B8]/60">
                    {isMine ? (
                      <span className="text-[#38BDF8] font-black">✓ Claimed By You</span>
                    ) : isClaimedByOther ? (
                      <span className="text-red-400 font-semibold truncate block">
                        👤 Taken: {claimedBy?.name}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]/40 font-bold">Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start Button Area */}
          <div className="border-t border-white/5 pt-5 text-center">
            {isHost ? (
              <div className="space-y-2.5 max-w-sm mx-auto">
                <button
                  onClick={startAuction}
                  disabled={!userTeamId}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer ${
                    userTeamId
                      ? 'bg-gradient-to-r from-[#38BDF8] to-[#0284C7] hover:shadow-[0_4px_25px_rgba(56,189,248,0.3)] text-[#07111F] animate-pulse'
                      : 'bg-white/5 border border-white/5 text-[#94A3B8]/40 cursor-not-allowed'
                  }`}
                >
                  Start Multiplayer Auction →
                </button>
                {!userTeamId && (
                  <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                    Please claim a team before starting the auction.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#030810]/40 border border-white/5 max-w-md mx-auto text-xs text-[#94A3B8]/60 uppercase tracking-wider font-extrabold flex items-center justify-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]/40 animate-ping"></span>
                <span>Waiting for Host ({clients.find(c => c.isHost)?.name || 'Auctioneer'}) to start...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </LobbyBackgroundProvider>
  );
}
