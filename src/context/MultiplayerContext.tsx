'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, initialPlayers } from '../data/players';
import { Team, getLobbyTeams } from '../data/teams';
import { soundEffects } from '../utils/sound';
import { voiceAuctioneer } from '../utils/voiceAuctioneer';
import { readVoiceEnabled, writeVoiceEnabled } from '../utils/voicePreferences';
import { getMultiplayerMode, getMultiplayerService } from '../lib/multiplayer';
import { RoomSnapshot } from '../lib/multiplayer/types';
import { asFirebaseArray } from '../lib/multiplayer/sanitizeForFirebase';

// Build a lookup map of player images
const playerImageMap: Record<string, string> = {};
initialPlayers.forEach(p => {
  if (p.image) {
    playerImageMap[p.id] = p.image;
    playerImageMap[p.name.toLowerCase().trim()] = p.image;
  }
});

const enrichPlayers = (playersList?: Player[] | Record<string, Player>): Player[] => {
  return asFirebaseArray(playersList).map(p => ({
    ...p,
    image: p.image || playerImageMap[p.id] || playerImageMap[p.name.toLowerCase().trim()] || ''
  }));
};

const enrichTeams = (teamsList?: Team[]): Team[] => {
  return (teamsList ?? []).map(t => ({
    ...t,
    players: enrichPlayers(t.players)
  }));
};

interface ClientPlayer {
  id: string;
  name: string;
  teamId: string | null;
  isHost: boolean;
}

interface MultiplayerContextType {
  /** False during SSR/first paint — avoid rendering client-only UI until true. */
  hydrated: boolean;
  clientId: string;
  multiplayerMode: 'firebase' | 'socket';
  roomCode: string | null;
  clients: ClientPlayer[];
  playerName: string;
  isHost: boolean;
  error: string | null;
  
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
  voiceEnabled: boolean;
  logs: string[];
  soldHistory: Player[];
  unsoldHistory: Player[];
  auctionStatus: 'idle' | 'bidding' | 'sold_splash' | 'unsold_splash' | 'completed';
  lastWinner: { player: Player; team: Team; price: number } | null;

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
  toggleVoice: () => void;
  leaveRoom: () => void;
  executeVoiceCommand: (command: any) => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mp = getMultiplayerService();
  const [hydrated, setHydrated] = useState(false);
  const [clientId, setClientId] = useState('');
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
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<'idle' | 'bidding' | 'sold_splash' | 'unsold_splash' | 'completed'>('idle');
  const [lastWinner, setLastWinner] = useState<{ player: Player; team: Team; price: number } | null>(null);

  const userTeamId = clients.find(c => c.id === clientId)?.teamId || null;
  const isHost = clients.find(c => c.id === clientId)?.isHost || false;

  const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const currentPlayer =
    players.find((p) => p.status === 'active') ||
    activePool[currentPlayerIndex] ||
    null;
  const soldHistory = players.filter(p => p.status === 'sold');
  const unsoldHistory = players.filter(p => p.status === 'unsold');

  const auctionStatusRef = useRef(auctionStatus);
  const teamsRef = useRef(teams);
  const playersRef = useRef(players);
  const lastSpokenPlayerIdRef = useRef<string | null>(null);
  const roomCodeRef = useRef(roomCode);

  useEffect(() => {
    auctionStatusRef.current = auctionStatus;
  }, [auctionStatus]);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const enabled = readVoiceEnabled();
    setVoiceEnabled(enabled);
    voiceAuctioneer.setEnabled(enabled);
  }, []);

  useEffect(() => {
    voiceAuctioneer.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    setHydrated(true);
    return mp.watchClientId(setClientId);
  }, [mp]);

  useEffect(() => {
    mp.connect();

    const applyRoomSnapshot = (data: RoomSnapshot) => {
      setRoomCode(data.code);
      setClients(data.clients ?? []);
      setPlayers(enrichPlayers(data.players));
      setTeams(enrichTeams(data.teams?.length ? data.teams : getLobbyTeams()));
      setLogs(data.logs ?? []);
      setAuctionStatus(data.auctionStatus ?? 'idle');
      setIsAuctionStarted(data.started ?? false);
      setIsPaused(data.isPaused ?? false);
      setError(null);
    };

    const onJoinError = (msg: string) => setError(msg);

    mp.on('room_created', applyRoomSnapshot);
    mp.on('room_joined', applyRoomSnapshot);
    mp.on('join_error', onJoinError);
    mp.on('claim_error', onJoinError);
    const onBidError = (msg: string) => setError(msg);
    mp.on('bid_error', onBidError);

    mp.on('player_joined', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    mp.on('player_left', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    mp.on('team_claimed', (data) => {
      setClients(data.clients);
      setLogs(data.logs);
    });

    mp.on('state_update', (data) => {
      setPlayers(enrichPlayers(data.players));
      if (data.teams?.length) {
        setTeams(enrichTeams(data.teams));
      }
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setTimer(data.timer);
      setIsPaused(data.isPaused);
      setIsAuctionStarted(data.started);
      setLogs(data.logs);
      
      const prevStatus = auctionStatusRef.current;
      setAuctionStatus(data.auctionStatus);
      setLastWinner(data.lastWinner ? {
        player: enrichPlayers([data.lastWinner.player])[0],
        team: enrichTeams([data.lastWinner.team])[0],
        price: data.lastWinner.price
      } : null);

      if (data.auctionStatus === 'sold_splash' && prevStatus !== 'sold_splash') {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();
      } else if (data.auctionStatus === 'unsold_splash' && prevStatus !== 'unsold_splash') {
        soundEffects.playGavelSound();
      }

      const pool = (data.players ?? []).filter((pl) => pl.status === 'pool' || pl.status === 'active');
      const p =
        (data.players ?? []).find((pl) => pl.status === 'active') ?? pool[0];
      if (p && data.currentBid === 0 && data.auctionStatus === 'bidding' && lastSpokenPlayerIdRef.current !== p.id) {
        lastSpokenPlayerIdRef.current = p.id;
        voiceAuctioneer.speakNextPlayer(p.name, `${p.base_price} crore`);
      }
    });

    mp.on('bid_placed', (data) => {
      setError(null);
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setTimer(data.timer);
      setLogs(data.logs);
      soundEffects.playBidSound();

      const bidTeam = data.currentBidderId ? teamsRef.current.find(t => t.id === data.currentBidderId) : null;
      if (bidTeam) {
        voiceAuctioneer.speakBidPlaced(bidTeam.shortName, `${data.currentBid} crore`, 3);
      }
    });

    mp.on('timer_tick', (data) => {
      setTimer(data.timer);
      setCurrentBid(data.currentBid);
      setCurrentBidderId(data.currentBidderId);
      setLogs(data.logs);

      if (data.aiBidMade) {
        soundEffects.playBidSound();
      }

      if (data.timer <= 3 && data.timer > 0) {
        soundEffects.playBuzzerSound();

        if (data.timer === 3) {
          voiceAuctioneer.speakCountdown("Going once...");
        } else if (data.timer === 2) {
          voiceAuctioneer.speakCountdown("Going twice...");
        } else if (data.timer === 1) {
          voiceAuctioneer.speakCountdown("Any further bids?");
        }
      }
    });

    mp.on('timer_end', (data) => {
      setPlayers(enrichPlayers(data.players));
      setTeams(enrichTeams(data.teams));
      setAuctionStatus(data.auctionStatus);
      setLastWinner(data.lastWinner ? {
        player: enrichPlayers([data.lastWinner.player])[0],
        team: enrichTeams([data.lastWinner.team])[0],
        price: data.lastWinner.price
      } : null);
      setLogs(data.logs);
      setIsPaused(true);

      if (data.auctionStatus === 'sold_splash') {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();

        const pool = playersRef.current.filter(pl => pl.status === 'pool' || pl.status === 'active');
        const p = pool[0];
        if (p && data.lastWinner) {
          voiceAuctioneer.speakSold(p.name, data.lastWinner.team.name, `${data.lastWinner.price} crore`);
        }
      } else {
        soundEffects.playGavelSound();

        const pool = playersRef.current.filter(pl => pl.status === 'pool' || pl.status === 'active');
        const p = pool[0];
        if (p) {
          voiceAuctioneer.speakUnsold(p.name);
        }
      }
    });

    mp.on('auction_paused', (data) => {
      setIsPaused(data.isPaused);
      setLogs(data.logs);
    });

    mp.on('auction_resumed', (data) => {
      setIsPaused(data.isPaused);
      setLogs(data.logs);
    });

    return () => {
      mp.off('room_created', applyRoomSnapshot);
      mp.off('room_joined', applyRoomSnapshot);
      mp.off('join_error', onJoinError);
      mp.off('claim_error', onJoinError);
      mp.off('bid_error', onBidError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = (name: string, customPlayers?: Player[]) => {
    setPlayerName(name);
    void mp.createRoom(
      name,
      customPlayers ||
        initialPlayers.map((p) => ({ ...p, status: 'pool' as const })),
      getLobbyTeams()
    );
  };

  const joinRoom = (code: string, name: string) => {
    setPlayerName(name);
    void mp.joinRoom(code, name);
  };

  const selectUserTeam = (teamId: string) => {
    if (!roomCode) return;
    void mp.claimTeam(roomCode, teamId || null);
  };

  const startAuction = () => {
    if (!roomCode || !isHost) return;
    void mp.startAuction(roomCode);
  };

  const pauseAuction = () => {
    if (!roomCode || !isHost) return;
    void mp.pauseAuction(roomCode);
  };

  const resumeAuction = () => {
    if (!roomCode || !isHost) return;
    void mp.resumeAuction(roomCode);
  };

  const placeUserBid = () => {
    if (!roomCode || !userTeamId) {
      setError('Claim a team in the lobby before bidding.');
      return;
    }
    if (auctionStatus !== 'bidding' || isPaused) {
      setError('Auction is not accepting bids right now.');
      return;
    }
    setError(null);
    void mp.placeBid(roomCode, userTeamId);
  };

  const skipPlayer = () => {
    if (!roomCode || !isHost) return;
    void mp.skipPlayer(roomCode);
  };

  const nextPlayer = () => {
    if (!roomCode || !isHost) return;
    void mp.nextPlayer(roomCode);
  };

  const resetAuction = () => {
    if (!roomCode || !isHost) return;
    void mp.resetAuction(
      roomCode,
      initialPlayers.map((p) => ({ ...p, status: 'pool' as const })),
      getLobbyTeams()
    );
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      writeVoiceEnabled(next);
      voiceAuctioneer.setEnabled(next);
      return next;
    });
  };

  const leaveRoom = () => {
    void mp.leaveRoom(roomCodeRef.current);
    setRoomCode(null);
    setClients([]);
    setPlayers([]);
    setTeams([]);
    setLogs([]);
    setAuctionStatus('idle');
    setIsAuctionStarted(false);
  };

  const executeVoiceCommand = (cmd: { type: string; name?: string; basePrice?: number; team?: string; price?: number }) => {
    if (!voiceEnabled || !roomCode || !isHost || !isAuctionStarted) return;

    switch (cmd.type) {
      case 'PAUSE':
        pauseAuction();
        break;
      case 'RESUME':
        resumeAuction();
        break;
      case 'UNSOLD':
        skipPlayer();
        break;
      case 'NEXT_PLAYER':
        nextPlayer();
        break;
      case 'NEXT_PLAYER_OVERRIDE':
        void mp.nextPlayer(roomCode, cmd.name, cmd.basePrice);
        break;
      case 'SELL_PLAYER':
        if (cmd.team && cmd.price !== undefined) {
          void mp.forceSell(roomCode, cmd.team, cmd.price);
        }
        break;
      default:
        break;
    }
  };

  return (
    <MultiplayerContext.Provider value={{
      hydrated,
      clientId,
      multiplayerMode: getMultiplayerMode(),
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
      voiceEnabled,
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
      toggleVoice,
      leaveRoom,
      executeVoiceCommand
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
