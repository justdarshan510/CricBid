'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, initialPlayers } from '../data/players';
import { Team, initialTeams } from '../data/teams';
import { solvePlayingXI, analyzeSquad } from '../utils/aiEngine';
import { soundEffects } from '../utils/sound';
import { voiceAuctioneer } from '../utils/voiceAuctioneer';
import { readVoiceEnabled, writeVoiceEnabled } from '../utils/voicePreferences';

interface AuctionContextType {
  // Game states
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

  // Actions
  selectUserTeam: (teamId: string) => void;
  startAuction: () => void;
  pauseAuction: () => void;
  resumeAuction: () => void;
  placeUserBid: () => void;
  skipPlayer: () => void;
  nextPlayer: () => void;
  resetAuction: () => void;
  importCSVPlayers: (customPlayers: Player[]) => void;
  toggleSound: () => void;
  toggleVoice: () => void;
  autoSimulateActivePlayer: () => void;
  executeVoiceCommand: (command: any) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ipl_auction_sim_state_v2';

// Standard bidding increment rules
export function getNextBidAmount(currentBid: number, basePrice: number): number {
  if (currentBid === 0) return basePrice;
  if (currentBid < 2.0) return parseFloat((currentBid + 0.20).toFixed(2));
  if (currentBid < 5.0) return parseFloat((currentBid + 0.50).toFixed(2));
  return parseFloat((currentBid + 1.00).toFixed(2));
}

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentBidderId, setCurrentBidderId] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(20);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [isAuctionStarted, setIsAuctionStarted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<'idle' | 'bidding' | 'sold_splash' | 'unsold_splash' | 'completed'>('idle');
  const [lastWinner, setLastWinner] = useState<{ player: Player; team: Team; price: number } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // References to keep timer loop updated without resetting effects
  const stateRef = useRef({
    players,
    teams,
    currentPlayerIndex,
    currentBid,
    currentBidderId,
    timer,
    isPaused,
    userTeamId,
    isAuctionStarted,
    auctionStatus
  });

  useEffect(() => {
    stateRef.current = {
      players,
      teams,
      currentPlayerIndex,
      currentBid,
      currentBidderId,
      timer,
      isPaused,
      userTeamId,
      isAuctionStarted,
      auctionStatus
    };
  }, [players, teams, currentPlayerIndex, currentBid, currentBidderId, timer, isPaused, userTeamId, isAuctionStarted, auctionStatus]);

  useEffect(() => {
    const enabled = readVoiceEnabled();
    setVoiceEnabled(enabled);
    voiceAuctioneer.setEnabled(enabled);
  }, []);

  useEffect(() => {
    voiceAuctioneer.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Load from local storage after mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Merge latest image URLs from initialPlayers to prevent cache staleness
        const mergedPlayers = (parsed.players || initialPlayers).map((p: Player) => {
          const freshPlayer = initialPlayers.find(ip => ip.id === p.id);
          if (freshPlayer && freshPlayer.image) {
            return { ...p, image: freshPlayer.image };
          }
          return p;
        });

        setPlayers(mergedPlayers);
        setTeams(parsed.teams || initialTeams);
        setCurrentPlayerIndex(parsed.currentPlayerIndex || 0);
        setCurrentBid(parsed.currentBid || 0);
        setCurrentBidderId(parsed.currentBidderId || null);
        setTimer(parsed.timer !== undefined ? parsed.timer : 20);
        setIsPaused(true); // Always start paused on reload
        setUserTeamId(parsed.userTeamId || null);
        setIsAuctionStarted(parsed.isAuctionStarted || false);
        setLogs(parsed.logs || []);
        setAuctionStatus(parsed.auctionStatus || 'idle');
        setLastWinner(parsed.lastWinner || null);
        if (parsed.soundEnabled !== undefined) {
          setSoundEnabled(parsed.soundEnabled);
          soundEffects.setEnabled(parsed.soundEnabled);
        }
        if (parsed.voiceEnabled !== undefined) {
          setVoiceEnabled(parsed.voiceEnabled);
          writeVoiceEnabled(parsed.voiceEnabled);
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        setPlayers(initialPlayers);
        setTeams(initialTeams);
      }
    } else {
      setPlayers(initialPlayers);
      setTeams(initialTeams);
    }
  }, []);

  // Save to local storage when key state changes
  useEffect(() => {
    if (!isMounted) return;
    const stateToSave = {
      players,
      teams,
      currentPlayerIndex,
      currentBid,
      currentBidderId,
      timer,
      userTeamId,
      isAuctionStarted,
      logs,
      auctionStatus,
      lastWinner,
      soundEnabled,
      voiceEnabled
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [players, teams, currentPlayerIndex, currentBid, currentBidderId, timer, userTeamId, isAuctionStarted, logs, auctionStatus, lastWinner, soundEnabled, voiceEnabled, isMounted]);

  // Derived properties
  const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const currentPlayer = activePool[currentPlayerIndex] || null;
  const soldHistory = players.filter(p => p.status === 'sold');
  const unsoldHistory = players.filter(p => p.status === 'unsold');

  // Synthesize buzzer if timer hits low values
  useEffect(() => {
    if (isAuctionStarted && !isPaused && auctionStatus === 'bidding' && timer <= 3 && timer > 0) {
      soundEffects.playBuzzerSound();

      // AI voice countdown announcements
      if (timer === 3) {
        voiceAuctioneer.speakCountdown("Going once...");
      } else if (timer === 2) {
        voiceAuctioneer.speakCountdown("Going twice...");
      } else if (timer === 1) {
        voiceAuctioneer.speakCountdown("Any further bids?");
      }
    }
  }, [timer, isPaused, isAuctionStarted, auctionStatus]);

  // Main Live Countdown Clock (Ticks every 1s)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const interval = setInterval(() => {
      const state = stateRef.current;
      if (!state.isAuctionStarted || state.isPaused || state.auctionStatus !== 'bidding') return;

      if (state.timer > 0) {
        setTimer(prev => prev - 1);
      } else {
        // Timer reached 0! Handle sold or unsold
        handleTimerEnd();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper to handle sold/unsold when timer hits 0
  const handleTimerEnd = () => {
    const state = stateRef.current;
    const activePool = state.players.filter(p => p.status === 'pool' || p.status === 'active');
    const p = activePool[state.currentPlayerIndex];
    if (!p) return;

    if (state.currentBidderId) {
      // SOLD!
      const winningTeam = state.teams.find(t => t.id === state.currentBidderId);
      if (winningTeam) {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();
        
        setLastWinner({ player: p, team: winningTeam, price: state.currentBid });
        setAuctionStatus('sold_splash');
        setIsPaused(true);

        // Update player status
        setPlayers(prev => prev.map(pl => {
          if (pl.id === p.id) {
            return { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: state.currentBid };
          }
          return pl;
        }));

        // Deduct purse and add player to squad
        setTeams(prev => prev.map(t => {
          if (t.id === winningTeam.id) {
            return {
              ...t,
              purse: parseFloat((t.purse - state.currentBid).toFixed(2)),
              players: [...t.players, { ...p, status: 'sold', sold_to: winningTeam.id, sold_price: state.currentBid }]
            };
          }
          return t;
        }));

        setLogs(prev => [`SOLD! ${p.name} bought by ${winningTeam.name} for ${state.currentBid.toFixed(2)} Cr!`, ...prev]);
        voiceAuctioneer.speakSold(p.name, winningTeam.name, `${state.currentBid} crore`);
      }
    } else {
      // UNSOLD
      soundEffects.playGavelSound();
      setAuctionStatus('unsold_splash');
      setIsPaused(true);

      // Update player status
      setPlayers(prev => prev.map(pl => {
        if (pl.id === p.id) {
          return { ...pl, status: 'unsold' };
        }
        return pl;
      }));

      setLogs(prev => [`PASSED: ${p.name} goes unsold.`, ...prev]);
      voiceAuctioneer.speakUnsold(p.name);
    }
  };

  // Simulate Bids from the 9 AI teams (Disabled)
  const simulateAIBids = () => {
    return;
  };


  // User Actions
  const selectUserTeam = (teamId: string) => {
    setUserTeamId(teamId);
    setLogs([`Team selected: ${initialTeams.find(t => t.id === teamId)?.name}. Ready for auction!`]);
  };

  const startAuction = () => {
    if (!userTeamId) return;
    setIsAuctionStarted(true);
    setAuctionStatus('bidding');
    setIsPaused(false);
    
    const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
    const p = activePool[currentPlayerIndex];
    if (p) {
      setCurrentBid(0); // starts with base price prompt
      setCurrentBidderId(null);
      setTimer(10);
      setLogs([`Player under the hammer: ${p.name} (Base Price: ${p.base_price} Cr)`, ...logs]);
      
      // Set status active
      setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, status: 'active' } : pl));

      // AI voice announcement
      voiceAuctioneer.speakNextPlayer(p.name, `${p.base_price} crore`);
    }
  };

  const pauseAuction = () => {
    setIsPaused(true);
  };

  const resumeAuction = () => {
    setIsPaused(false);
  };

  const placeUserBid = () => {
    if (!userTeamId || isPaused || auctionStatus !== 'bidding') return;
    
    const p = currentPlayer;
    if (!p) return;

    const nextBid = getNextBidAmount(currentBid, p.base_price);
    const userTeam = teams.find(t => t.id === userTeamId);

    if (!userTeam) return;

    // Verify rules constraints
    const squadRep = analyzeSquad(userTeam.players, userTeam.purse);
    const isOverseasLimit = p.overseas && squadRep.overseasCount >= 8;
    const isSquadLimit = userTeam.players.length >= 25;
    
    // Purse limit checks
    const slotsToMin = Math.max(0, 12 - userTeam.players.length);
    const minRequiredReserve = slotsToMin * 0.20;
    
    if (isSquadLimit) {
      setLogs(prev => [`System warning: Cannot bid. Squad already reached max size of 25!`, ...prev]);
      return;
    }
    if (isOverseasLimit) {
      setLogs(prev => [`System warning: Cannot bid. Squad already reached max of 8 overseas players!`, ...prev]);
      return;
    }
    if (userTeam.purse < nextBid) {
      setLogs(prev => [`System warning: Insufficient purse! You have ${userTeam.purse.toFixed(2)} Cr left, bid needs ${nextBid.toFixed(2)} Cr.`, ...prev]);
      return;
    }

    if (currentBidderId === userTeamId) {
      // Already holding high bid
      return;
    }

    // Place user bid
    soundEffects.playBidSound();
    setCurrentBid(nextBid);
    setCurrentBidderId(userTeamId);
    setLogs(prev => [`Your Team (${userTeam.shortName}) bids ${nextBid.toFixed(2)} Cr`, ...prev]);
    
    if (timer < 8) {
      setTimer(8);
    }

    // AI voice announcement
    voiceAuctioneer.speakBidPlaced(userTeam.shortName, `${nextBid} crore`, 3);
  };

  const skipPlayer = () => {
    const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
    const p = activePool[currentPlayerIndex];
    if (!p) return;

    soundEffects.playGavelSound();
    
    // Mark unsold
    setPlayers(prev => prev.map(pl => {
      if (pl.id === p.id) {
        return { ...pl, status: 'unsold' };
      }
      return pl;
    }));

    setLogs(prev => [`SKIPPED: ${p.name} marked unsold immediately.`, ...prev]);
    setAuctionStatus('unsold_splash');
    setIsPaused(true);
  };

  const nextPlayer = () => {
    const remainingPool = players.filter(p => p.status === 'pool' || p.status === 'active');
    
    // Check if we are finished
    if (remainingPool.length <= 1) {
      setAuctionStatus('completed');
      setIsPaused(true);
      return;
    }

    // Load next player
    setCurrentBid(0);
    setCurrentBidderId(null);
    setTimer(10);
    setAuctionStatus('bidding');
    setIsPaused(false);
    
    const nextP = remainingPool[0]; // because previous was removed from 'pool'
    if (nextP) {
      setLogs([`Player under the hammer: ${nextP.name} (Base Price: ${nextP.base_price} Cr)`]);
      setPlayers(prev => prev.map(pl => pl.id === nextP.id ? { ...pl, status: 'active' } : pl));

      // AI voice announcement
      voiceAuctioneer.speakNextPlayer(nextP.name, `${nextP.base_price} crore`);
    }
  };

  const resetAuction = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setPlayers(initialPlayers.map(p => ({ ...p, status: 'pool', sold_to: undefined, sold_price: undefined })));
    setTeams(initialTeams.map(t => ({ ...t, purse: 120.0, players: [] })));
    setCurrentPlayerIndex(0);
    setCurrentBid(0);
    setCurrentBidderId(null);
    setTimer(10);
    setIsPaused(true);
    setUserTeamId(null);
    setIsAuctionStarted(false);
    setLogs([]);
    setAuctionStatus('idle');
    setLastWinner(null);
  };

  const importCSVPlayers = (customPlayers: Player[]) => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setPlayers(customPlayers.map(p => ({ ...p, status: 'pool' })));
    setTeams(initialTeams.map(t => ({ ...t, purse: 120.0, players: [] })));
    setCurrentPlayerIndex(0);
    setCurrentBid(0);
    setCurrentBidderId(null);
    setTimer(10);
    setIsPaused(true);
    setIsAuctionStarted(false);
    setLogs([`Successfully loaded ${customPlayers.length} custom players via CSV! Select a team to begin.`]);
    setAuctionStatus('idle');
    setLastWinner(null);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundEffects.setEnabled(nextVal);
  };

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    writeVoiceEnabled(nextVal);
    voiceAuctioneer.setEnabled(nextVal);
  };

  const autoSimulateActivePlayer = () => {
    const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
    const p = activePool[currentPlayerIndex];
    if (!p || auctionStatus !== 'bidding') return;

    const eligibleTeams = teams.filter(t => {
      const slotsLeft = 25 - t.players.length;
      const isOverseasLimit = p.overseas && t.players.filter(pl => pl.overseas).length >= 8;
      return slotsLeft > 0 && !isOverseasLimit && t.purse >= p.base_price;
    });

    if (eligibleTeams.length === 0 || Math.random() < 0.15) {
      soundEffects.playGavelSound();
      setAuctionStatus('unsold_splash');
      setIsPaused(true);
      setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, status: 'unsold' } : pl));
      setLogs(prev => [`PASSED: ${p.name} goes unsold via Fast Solve.`, ...prev]);
    } else {
      const winningTeam = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
      
      let simulatedPrice = p.base_price;
      const numBids = Math.floor(Math.random() * 12);
      for (let i = 0; i < numBids; i++) {
        const next = getNextBidAmount(simulatedPrice, p.base_price);
        if (next <= winningTeam.purse) {
          simulatedPrice = next;
        } else {
          break;
        }
      }
      simulatedPrice = parseFloat(simulatedPrice.toFixed(2));

      soundEffects.playSoldSound();
      soundEffects.playGavelSound();
      
      setLastWinner({ player: p, team: winningTeam, price: simulatedPrice });
      setAuctionStatus('sold_splash');
      setIsPaused(true);

      setPlayers(prev => prev.map(pl => {
        if (pl.id === p.id) {
          return { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: simulatedPrice };
        }
        return pl;
      }));

      setTeams(prev => prev.map(t => {
        if (t.id === winningTeam.id) {
          const updatedPlayer: Player = { ...p, status: 'sold', sold_to: winningTeam.id, sold_price: simulatedPrice };
          return {
            ...t,
            purse: parseFloat((t.purse - simulatedPrice).toFixed(2)),
            players: [...t.players, updatedPlayer]
          };
        }
        return t;
      }));

      const bidderName = winningTeam.id === userTeamId ? 'Your Team' : winningTeam.name;
      setLogs(prev => [`SOLD! ${p.name} bought by ${bidderName} for ${simulatedPrice.toFixed(2)} Cr via Fast Solve!`, ...prev]);

      // AI voice announcement
      voiceAuctioneer.speakSold(p.name, winningTeam.name, `${simulatedPrice} crore`);
    }
  };

  const executeVoiceCommand = (cmd: any) => {
    if (!voiceEnabled || !isAuctionStarted) return;
    
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
        if (cmd.name) {
          const cleanName = cmd.name.toLowerCase().trim();
          const targetIndex = players.findIndex(p => 
            (p.status === 'pool' || p.status === 'unsold' || p.status === 'active') &&
            p.name.toLowerCase().includes(cleanName)
          );

          if (targetIndex !== -1) {
            setPlayers(prev => {
              const list = [...prev];
              const targetPlayer = { ...list[targetIndex] };
              targetPlayer.status = 'pool';
              if (cmd.basePrice !== undefined && !isNaN(cmd.basePrice)) {
                targetPlayer.base_price = cmd.basePrice;
              }
              list.splice(targetIndex, 1);
              let insertIndex = list.findIndex(pl => pl.status === 'pool');
              if (insertIndex === -1) insertIndex = 0;
              list.splice(insertIndex, 0, targetPlayer);
              return list;
            });
            
            setLogs(prev => [`Voice command override: Load ${cmd.name} next!`, ...prev]);
            setTimeout(() => {
              nextPlayer();
            }, 150);
          }
        }
        break;
      case 'SELL_PLAYER':
        if (cmd.team && cmd.price) {
          const p = currentPlayer;
          if (!p) return;
          const winningTeam = teams.find(t => t.id === cmd.team);
          if (winningTeam) {
            soundEffects.playSoldSound();
            soundEffects.playGavelSound();
            
            setLastWinner({ player: p, team: winningTeam, price: cmd.price });
            setAuctionStatus('sold_splash');
            setIsPaused(true);

            setPlayers(prev => prev.map(pl => {
              if (pl.id === p.id) {
                return { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: cmd.price };
              }
              return pl;
            }));

            setTeams(prev => prev.map(t => {
              if (t.id === winningTeam.id) {
                return {
                  ...t,
                  purse: parseFloat((t.purse - cmd.price).toFixed(2)),
                  players: [...t.players, { ...p, status: 'sold', sold_to: winningTeam.id, sold_price: cmd.price }]
                };
              }
              return t;
            }));

            setLogs(prev => [`SOLD! ${p.name} sold to ${winningTeam.name} for ${cmd.price.toFixed(2)} Cr via Voice!`, ...prev]);
            voiceAuctioneer.speakSold(p.name, winningTeam.name, `${cmd.price} crore`);
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <AuctionContext.Provider value={{
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
      selectUserTeam,
      startAuction,
      pauseAuction,
      resumeAuction,
      placeUserBid,
      skipPlayer,
      nextPlayer,
      resetAuction,
      importCSVPlayers,
      toggleSound,
      toggleVoice,
      autoSimulateActivePlayer,
      executeVoiceCommand
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
