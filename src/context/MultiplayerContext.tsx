'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, initialPlayers } from '../data/players';
import { Team, initialTeams } from '../data/teams';
import { soundEffects } from '../utils/sound';
import { getSocket } from '../utils/socketClient';

interface ClientPlayer {
  id: string;
  name: string;
  teamId: string | null;
  isHost: boolean;
}

interface MultiplayerContextType {
  // Socket Room specific states
  roomCode: string | null;
  clients: ClientPlayer[];
  playerName: string;
  isHost: boolean;
  error: string | null;
  
  // Game states mirrored from server
  players: Player[];
  teams: Team[];
  currentPlayerIndex: number;
  currentPlayer: Player | null;
  currentBid: number;
  currentBidderId: string | null;
  timer: number;
  isPaused: boolean;
  userTeamId: string | null;
  isAuctionStarted: boolean;
  soundEnabled: boolean;
  logs: string[];
  soldHistory: Player[];
  unsoldHistory: Player[];
  auctionStatus: 'idle' | 'bidding' | 'sold_splash' | 'unsold_splash' | 'completed';
  lastWinner: { player: Player; team: Team; price: number } | null;

  // Actions
  createRoom: (name: string, customPlayers?: Player[]) => void;
  joinRoom: (code: string, name: string) => void;
  selectUserTeam: (teamId: string) => void;
  startAuction: () => void;
  pauseAuction: () => void;
  resumeAuction: () => void;
  placeUserBid: () => void;
  skipPlayer: () => void;
  nextPlayer: () => void;
  resetAuction: () => void;
  toggleSound: () => void;
  autoSimulateActivePlayer: () => void;
  leaveRoom: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientPlayer[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentBidderId, setCurrentBidderId] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(10);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [isAuctionStarted, setIsAuctionStarted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<'idle' | 'bidding' | 'sold_splash' | 'unsold_splash' | 'completed'>('idle');
  const [lastWinner, setLastWinner] = useState<{ player: Player; team: Team; price: number } | null>(null);

  const socket = getSocket();

  // Find user's claimed team ID in clients list
  const userTeamId = clients.find(c => c.id === socket.id)?.teamId || null;
  const isHost = clients.find(c => c.id === socket.id)?.isHost || false;

  // Derived history listings
  const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const currentPlayer = activePool[currentPlayerIndex] || null;
  const soldHistory = players.filter(p => p.status === 'sold');
  const unsoldHistory = players.filter(p => p.status === 'unsold');

  const auctionStatusRef = useRef(auctionStatus);
  useEffect(() => {
    auctionStatusRef.current = auctionStatus;
  }, [auctionStatus]);

  // Sync sound settings with sound utility
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Connect socket and register listeners
  useEffect(() => {
    socket.connect();

    socket.on('room_created', (data) => {
      setRoomCode(data.code);
      setClients(data.clients);
      setPlayers(data.players);
      setTeams(data.teams);
      setLogs(data.logs);
      setAuctionStatus(data.auctionStatus);
      setIsAuctionStarted(data.started);
      setIsPaused(data.isPaused);
      setError(null);
    });

    socket.on('room_joined', (data) => {
      setRoomCode(data.code);
      setClients(data.clients);
      setPlayers(data.players);
      setTeams(data.teams);
      setLogs(data.logs);
      setAuctionStatus(data.auctionStatus);
      setIsAuctionStarted(data.started);
      setIsPaused(data.isPaused);
      setError(null);
    });

    socket.on('join_error', (msg) => {
      setError(msg);
    });

    socket.on('claim_error', (msg) => {
      setError(msg);
    });

    socket.on('bid_error', (msg) => {
      setError(msg);
    });

    socket.on('player_joined', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    socket.on('player_left', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    socket.on('team_claimed', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    socket.on('state_update', (data) => {
      setPlayers(data.players);
      setTeams(data.teams);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setTimer(data.timer);
      setIsPaused(data.isPaused);
      setIsAuctionStarted(data.started);
      setLogs(data.logs);
      
      const prevStatus = auctionStatusRef.current;
      setAuctionStatus(data.auctionStatus);
      setLastWinner(data.lastWinner);

      // Trigger splash sounds on transition
      if (data.auctionStatus === 'sold_splash' && prevStatus !== 'sold_splash') {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();
      } else if (data.auctionStatus === 'unsold_splash' && prevStatus !== 'unsold_splash') {
        soundEffects.playGavelSound();
      }
    });

    socket.on('bid_placed', (data) => {
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setTimer(data.timer);
      setLogs(data.logs);
      soundEffects.playBidSound();
    });

    socket.on('timer_tick', (data) => {
      setTimer(data.timer);
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setLogs(data.logs);

      if (data.aiBidMade) {
        soundEffects.playBidSound();
      }

      if (data.timer <= 3 && data.timer > 0) {
        soundEffects.playBuzzerSound();
      }
    });

    socket.on('timer_end', (data) => {
      setPlayers(data.players);
      setTeams(data.teams);
      setAuctionStatus(data.auctionStatus);
      setLastWinner(data.lastWinner);
      setLogs(data.logs);
      setIsPaused(true);

      if (data.auctionStatus === 'sold_splash') {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();
      } else {
        soundEffects.playGavelSound();
      }
    });

    socket.on('auction_paused', (data) => {
      setIsPaused(data.isPaused);
      setLogs(data.logs);
    });

    socket.on('auction_resumed', (data) => {
      setIsPaused(data.isPaused);
      setLogs(data.logs);
    });

    return () => {
      // Only remove listeners — do NOT disconnect the socket here.
      // Disconnecting on every re-render would kick the player from their room.
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('join_error');
      socket.off('claim_error');
      socket.off('bid_error');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('team_claimed');
      socket.off('state_update');
      socket.off('bid_placed');
      socket.off('timer_tick');
      socket.off('timer_end');
      socket.off('auction_paused');
      socket.off('auction_resumed');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actions
  const createRoom = (name: string, customPlayers?: Player[]) => {
    setPlayerName(name);
    socket.emit('create_room', {
      hostName: name,
      players: customPlayers || initialPlayers.map(p => ({ ...p, status: 'pool', sold_to: undefined, sold_price: undefined })),
      teams: initialTeams.map(t => ({ ...t, purse: 120.0, players: [] }))
    });
  };

  const joinRoom = (code: string, name: string) => {
    setPlayerName(name);
    socket.emit('join_room', {
      roomCode: code,
      playerName: name
    });
  };

  const selectUserTeam = (teamId: string) => {
    if (!roomCode) return;
    socket.emit('claim_team', {
      roomCode,
      teamId
    });
  };

  const startAuction = () => {
    if (!roomCode || !isHost) return;
    socket.emit('start_auction', { roomCode });
  };

  const pauseAuction = () => {
    if (!roomCode || !isHost) return;
    socket.emit('pause_auction', { roomCode });
  };

  const resumeAuction = () => {
    if (!roomCode || !isHost) return;
    socket.emit('resume_auction', { roomCode });
  };

  const placeUserBid = () => {
    if (!roomCode || !userTeamId) return;
    socket.emit('place_bid', {
      roomCode,
      teamId: userTeamId
    });
  };

  const skipPlayer = () => {
    if (!roomCode || !isHost) return;
    socket.emit('skip_player', { roomCode });
  };

  const nextPlayer = () => {
    if (!roomCode || !isHost) return;
    socket.emit('next_player', { roomCode });
  };

  const resetAuction = () => {
    if (!roomCode || !isHost) return;
    socket.emit('reset_auction', {
      roomCode,
      initialPlayersList: initialPlayers.map(p => ({ ...p, status: 'pool', sold_to: undefined, sold_price: undefined })),
      initialTeamsList: initialTeams.map(t => ({ ...t, purse: 120.0, players: [] }))
    });
  };

  const autoSimulateActivePlayer = () => {
    if (!roomCode || !isHost) return;
    socket.emit('fast_solve', { roomCode });
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const leaveRoom = () => {
    socket.disconnect();
    setRoomCode(null);
    setClients([]);
    setPlayers([]);
    setTeams([]);
    setLogs([]);
    setAuctionStatus('idle');
    setIsAuctionStarted(false);
    socket.connect(); // reconnect socket for future sessions
  };

  return (
    <MultiplayerContext.Provider value={{
      roomCode,
      clients,
      playerName,
      isHost,
      error,
      players,
      teams,
      currentPlayerIndex,
      currentPlayer,
      currentBid,
      currentBidderId,
      timer,
      isPaused,
      userTeamId,
      isAuctionStarted,
      soundEnabled,
      logs,
      soldHistory,
      unsoldHistory,
      auctionStatus,
      lastWinner,
      createRoom,
      joinRoom,
      selectUserTeam,
      startAuction,
      pauseAuction,
      resumeAuction,
      placeUserBid,
      skipPlayer,
      nextPlayer,
      resetAuction,
      toggleSound,
      autoSimulateActivePlayer,
      leaveRoom
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};
