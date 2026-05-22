'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { CSVUploader } from '../../components/CSVUploader';
import { Player } from '../../data/players';
import { getSocket } from '../../utils/socketClient';

export default function LobbyPage() {
  const router = useRouter();
  const socket = getSocket();
  const {
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

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [localName, setLocalName] = useState('');
  const [localCode, setLocalCode] = useState('');
  const [customPlayers, setCustomPlayers] = useState<Player[] | undefined>(undefined);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);

  // Redirect to room if started
  useEffect(() => {
    if (roomCode && isAuctionStarted) {
      router.push('/multiplayer-room');
    }
  }, [roomCode, isAuctionStarted, router]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim()) return;
    createRoom(localName.trim(), customPlayers);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim() || !localCode.trim()) return;
    joinRoom(localCode.trim(), localName.trim());
  };

  const handleCSVSuccess = (players: Player[]) => {
    setCustomPlayers(players);
    setCsvMsg(`Successfully loaded ${players.length} custom players! They will be used when you create the room.`);
    setTimeout(() => setCsvMsg(null), 5000);
  };

  // Render Lobby Setup Screen (Before entering room)
  if (!roomCode) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest font-black text-yellow-400 bg-yellow-950/60 border border-yellow-800/80 px-3.5 py-1.5 rounded-full inline-block">
            ⚡ Play with Friends
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Multiplayer Room Lobby
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
            Host a room to invite your friends using a room code, or enter an active room code to join their auction live.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-900 justify-center space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-300 ${
              activeTab === 'create'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all duration-300 ${
              activeTab === 'join'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Join Room
          </button>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/40 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400">
                  Your Nickname / Host Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Nickname..."
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  maxLength={15}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Optional Roster database upload */}
              <div className="border-t border-slate-900 pt-6 space-y-3">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>📂</span>
                  <span>Upload Custom CSV roster (Optional)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Seeds a custom player list for the draft pool. Leaves standard pool if skipped.
                </p>
                <CSVUploader onUploadSuccess={handleCSVSuccess} />
                {csvMsg && (
                  <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 p-2 rounded-xl text-center">
                    {csvMsg}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-yellow-500/10 transition active:scale-98"
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
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
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
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors tracking-widest font-black text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-yellow-500/10 transition active:scale-98"
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
    <div className="py-6 space-y-8 max-w-5xl mx-auto">
      {/* Top Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-5 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-widest px-2.5 py-1 bg-yellow-950/60 border border-yellow-800/80 rounded-md inline-block mb-1.5 animate-pulse">
            Waiting Room Lobby
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Room Code: <span className="text-yellow-400 font-mono tracking-widest select-all">{roomCode}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Share this 6-digit room code with your friends so they can join.
          </p>
        </div>

        <button
          onClick={leaveRoom}
          className="px-5 py-2.5 rounded-xl border border-red-900/40 text-red-400 hover:text-white hover:bg-red-950/30 text-xs font-extrabold uppercase tracking-wider transition"
        >
          Exit Room
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT PANEL: Connected Players List (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col">
          <h2 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-3 flex items-center justify-between">
            <span>Connected Players ({clients.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </h2>
          
          <div className="glass-card rounded-2xl border border-slate-800/80 p-4 space-y-3 flex-grow overflow-y-auto max-h-[350px]">
            {clients.map((c) => {
              const clientTeam = teams.find(t => t.id === c.teamId);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-900"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-white block">
                        {c.name} {c.id === socket.id && ' (You)'}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">
                        {c.isHost ? '👑 Host / Auctioneer' : 'Player'}
                      </span>
                    </div>
                  </div>

                  {clientTeam ? (
                    <span
                      className="text-[9px] font-black px-2 py-1 rounded uppercase shadow-sm"
                      style={{ backgroundColor: `${clientTeam.color}20`, border: `1px solid ${clientTeam.color}50`, color: clientTeam.color }}
                    >
                      {clientTeam.shortName}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-600 uppercase">Spectating</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Team Claiming Board (Col Span 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-1">
              Select Your IPL Franchise
            </h2>
            <p className="text-[11px] text-slate-400">
              Pick a franchise to manage during the draft. Unclaimed franchises will be automated by AI during bidding wars.
            </p>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/40 p-2.5 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((t) => {
              const claimedBy = clients.find(c => c.teamId === t.id);
              const isMine = userTeamId === t.id;
              const isClaimedByOther = claimedBy && !isMine;

              return (
                <div
                  key={t.id}
                  onClick={() => !isClaimedByOther && selectUserTeam(isMine ? '' : t.id)}
                  className={`glass-card p-4 rounded-xl border relative overflow-hidden group select-none flex flex-col justify-between transition-all duration-300 ${
                    isMine
                      ? 'ring-2 ring-opacity-50 scale-102 bg-slate-900/90'
                      : isClaimedByOther
                      ? 'bg-slate-950/10 border-slate-950/50 opacity-40 cursor-not-allowed'
                      : 'bg-slate-950/40 hover:bg-slate-900/40 hover:-translate-y-0.5 cursor-pointer'
                  }`}
                  style={{
                    boxShadow: isMine ? `0 0 15px ${t.color}35` : undefined,
                    borderWidth: '1px',
                    borderColor: isMine ? t.color : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-0.5"
                    style={{ backgroundColor: t.color }}
                  ></div>

                  <div className="flex items-center space-x-2.5 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner relative"
                      style={{
                        backgroundColor: `${t.color}15`,
                        border: `1px solid ${t.color}30`,
                        color: t.color
                      }}
                    >
                      {t.shortName}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white group-hover:text-yellow-400 transition-colors uppercase leading-none truncate max-w-[120px]">
                        {t.name}
                      </h3>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-1">
                        120.0 Cr Purse
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-2 text-[9px] uppercase tracking-wider text-slate-500">
                    {isMine ? (
                      <span className="text-yellow-400 font-extrabold">✓ Claimed By You</span>
                    ) : isClaimedByOther ? (
                      <span className="text-red-400 font-semibold truncate block">
                        👤 Taken: {claimedBy?.name}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium">Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start Button Area */}
          <div className="border-t border-slate-900 pt-5 text-center">
            {isHost ? (
              <div className="space-y-2.5 max-w-sm mx-auto">
                <button
                  onClick={startAuction}
                  disabled={!userTeamId}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg ${
                    userTeamId
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-950 hover:shadow-yellow-500/10 active:scale-98 animate-pulse'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
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
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 max-w-md mx-auto text-xs text-slate-500 uppercase tracking-wider font-extrabold flex items-center justify-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-ping"></span>
                <span>Waiting for Host ({clients.find(c => c.isHost)?.name || 'Auctioneer'}) to start...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
