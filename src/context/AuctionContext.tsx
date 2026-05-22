'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, initialPlayers } from '../data/players';
import { Team, initialTeams } from '../data/teams';
import { solvePlayingXI, analyzeSquad } from '../utils/aiEngine';
import { soundEffects } from '../utils/sound';

interface AuctionContextType {
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
  autoSimulateActivePlayer: () => void;
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
  const [timer, setTimer] = useState<number>(10);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [isAuctionStarted, setIsAuctionStarted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
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

  // Load from local storage after mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players || initialPlayers);
        setTeams(parsed.teams || initialTeams);
        setCurrentPlayerIndex(parsed.currentPlayerIndex || 0);
        setCurrentBid(parsed.currentBid || 0);
        setCurrentBidderId(parsed.currentBidderId || null);
        setTimer(parsed.timer !== undefined ? parsed.timer : 10);
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
      soundEnabled
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [players, teams, currentPlayerIndex, currentBid, currentBidderId, timer, userTeamId, isAuctionStarted, logs, auctionStatus, lastWinner, soundEnabled, isMounted]);

  // Derived properties
  const activePool = players.filter(p => p.status === 'pool' || p.status === 'active');
  const currentPlayer = activePool[currentPlayerIndex] || null;
  const soldHistory = players.filter(p => p.status === 'sold');
  const unsoldHistory = players.filter(p => p.status === 'unsold');

  // Synthesize buzzer if timer hits low values
  useEffect(() => {
    if (isAuctionStarted && !isPaused && auctionStatus === 'bidding' && timer <= 3 && timer > 0) {
      soundEffects.playBuzzerSound();
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
        
        // AI Opponent Bidding Roll
        // On every second, 45% chance an AI team makes a bid if interested
        if (Math.random() < 0.45) {
          simulateAIBids();
        }
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
    }
  };

  // Simulate Bids from the 9 AI teams
  const simulateAIBids = () => {
    const state = stateRef.current;
    const activePool = state.players.filter(p => p.status === 'pool' || p.status === 'active');
    const p = activePool[state.currentPlayerIndex];
    if (!p) return;

    const nextBid = getNextBidAmount(state.currentBid, p.base_price);

    // List of candidates to place a bid (opponent teams only, with enough purse)
    const opponentTeams = state.teams.filter(t => t.id !== state.userTeamId);
    const interestedTeams: { team: Team; valuation: number }[] = [];

    opponentTeams.forEach(t => {
      // Rules limits check
      const squadRep = analyzeSquad(t.players, t.purse);
      const isOverseasLimit = p.overseas && squadRep.overseasCount >= 8;
      const isSquadLimit = t.players.length >= 25;
      
      // Minimum budget protection check:
      // Keep at least 0.20 Cr for each remaining slot to reach the minimum squad of 12
      const slotsToMin = Math.max(0, 12 - t.players.length);
      const minRequiredReserve = slotsToMin * 0.20;
      const hasBudget = t.purse - nextBid >= minRequiredReserve && t.purse >= nextBid;

      if (isOverseasLimit || isSquadLimit || !hasBudget) return;

      // AI Valuation logic
      // Base valuation formula: base_price * multiplier
      // Rating scaling: rating 99 = 6.5x base price. rating 80 = 3.5x base price.
      let ratingMultiplier = 1.0 + (p.rating - 50) / 7.5; 
      
      // Adjust multiplier based on team purse:
      // If team has low purse, scale valuation down
      let purseFactor = Math.min(1.0, t.purse / 100.0);
      if (t.purse < 15.0) {
        purseFactor = 0.5 + (t.purse / 30.0); // throttling bidding range
      }
      
      // Role needs check:
      let needBoost = 1.0;
      const roleCount = squadRep.roleCounts[p.role] || 0;
      if (roleCount === 0) {
        needBoost = 1.4; // High interest
      } else if (roleCount >= 4) {
        needBoost = 0.5; // low interest
      }

      // Final maximum valuation
      let vMax = p.base_price * ratingMultiplier * purseFactor * needBoost;
      vMax = parseFloat(Math.max(p.base_price, vMax).toFixed(2));

      // If next bid is within their valuation, they are interested
      if (nextBid <= vMax && state.currentBidderId !== t.id) {
        interestedTeams.push({ team: t, valuation: vMax });
      }
    });

    if (interestedTeams.length === 0) return;

    // Pick one team based on highest valuation or randomly
    // Let's sort by valuation descending and add minor randomness
    interestedTeams.sort((a, b) => b.valuation - a.valuation);
    const chosen = interestedTeams[0].team;

    // Place bid
    soundEffects.playBidSound();
    setCurrentBid(nextBid);
    setCurrentBidderId(chosen.id);
    setLogs(prev => [`${chosen.shortName} bids ${nextBid.toFixed(2)} Cr`, ...prev]);
    
    // Reset timer to 8 if it fell below 8 (provides breathing room for bidding wars)
    if (state.timer < 8) {
      setTimer(8);
    }
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

  // Speed up and auto-simulate bidding for the active player without user intervention
  const autoSimulateActivePlayer = () => {
    if (isPaused || auctionStatus !== 'bidding') return;
    
    // Force immediately solve active bidding through a fast-forward algorithm
    const activeP = currentPlayer;
    if (!activeP) return;

    let localBid = currentBid;
    let localBidderId = currentBidderId;

    // Run bidding war logic up to 50 cycles or until no more bids
    let activeBidding = true;
    let loopProtect = 0;

    const opponentTeams = teams; // All teams can participate in fast-forward simulation

    while (activeBidding && loopProtect < 100) {
      loopProtect++;
      const nextBid = getNextBidAmount(localBid, activeP.base_price);
      const bidders: string[] = [];

      opponentTeams.forEach(t => {
        // Skip current high bidder
        if (t.id === localBidderId) return;

        const squadRep = analyzeSquad(t.players, t.purse);
        const isOverseasLimit = activeP.overseas && squadRep.overseasCount >= 8;
        const isSquadLimit = t.players.length >= 25;
        const slotsToMin = Math.max(0, 12 - t.players.length);
        const minRequiredReserve = slotsToMin * 0.20;
        const hasBudget = t.purse - nextBid >= minRequiredReserve && t.purse >= nextBid;

        if (isOverseasLimit || isSquadLimit || !hasBudget) return;

        // Simple valuation logic
        let ratingMultiplier = 1.0 + (activeP.rating - 50) / 7.5;
        let purseFactor = Math.min(1.0, t.purse / 100.0);
        if (t.purse < 15.0) purseFactor = 0.5 + (t.purse / 30.0);
        
        let needBoost = 1.0;
        if (squadRep.roleCounts[activeP.role] === 0) needBoost = 1.4;

        let vMax = activeP.base_price * ratingMultiplier * purseFactor * needBoost;
        vMax = parseFloat(Math.max(activeP.base_price, vMax).toFixed(2));

        if (nextBid <= vMax) {
          bidders.push(t.id);
        }
      });

      if (bidders.length > 0) {
        // Pick random bidder
        const idx = Math.floor(Math.random() * bidders.length);
        localBidderId = bidders[idx];
        localBid = nextBid;
      } else {
        activeBidding = false;
      }
    }

    // Trigger sold or unsold immediately based on local simulated results
    if (localBidderId) {
      const winningTeam = teams.find(t => t.id === localBidderId);
      if (winningTeam) {
        soundEffects.playSoldSound();
        soundEffects.playGavelSound();
        
        setLastWinner({ player: activeP, team: winningTeam, price: localBid });
        setAuctionStatus('sold_splash');
        setIsPaused(true);

        setPlayers(prev => prev.map(pl => pl.id === activeP.id ? { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: localBid } : pl));

        setTeams(prev => prev.map(t => {
          if (t.id === winningTeam.id) {
            return {
              ...t,
              purse: parseFloat((t.purse - localBid).toFixed(2)),
              players: [...t.players, { ...activeP, status: 'sold', sold_to: winningTeam.id, sold_price: localBid }]
            };
          }
          return t;
        }));

        setLogs(prev => [`SOLD! (Auto) ${activeP.name} bought by ${winningTeam.name} for ${localBid.toFixed(2)} Cr!`, ...prev]);
      }
    } else {
      soundEffects.playGavelSound();
      setAuctionStatus('unsold_splash');
      setIsPaused(true);

      setPlayers(prev => prev.map(pl => pl.id === activeP.id ? { ...pl, status: 'unsold' } : pl));
      setLogs(prev => [`PASSED: ${activeP.name} is unsold.`, ...prev]);
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
      autoSimulateActivePlayer
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
