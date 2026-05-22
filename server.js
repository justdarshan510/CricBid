const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Standard bidding increment rules
function getNextBidAmount(currentBid, basePrice) {
  if (currentBid === 0) return basePrice;
  if (currentBid < 2.0) return parseFloat((currentBid + 0.20).toFixed(2));
  if (currentBid < 5.0) return parseFloat((currentBid + 0.50).toFixed(2));
  return parseFloat((currentBid + 1.00).toFixed(2));
}

// Analyze squad composition
function analyzeSquad(squad, currentPurse) {
  const errors = [];
  const warnings = [];
  const roleCounts = {
    opener: 0,
    middle_order: 0,
    finisher: 0,
    all_rounder: 0,
    spinner: 0,
    death_bowler: 0,
    powerplay_bowler: 0
  };

  squad.forEach(p => {
    if (roleCounts[p.role] !== undefined) {
      roleCounts[p.role]++;
    }
  });

  const overseasCount = squad.filter(p => p.overseas).length;

  if (squad.length > 25) {
    errors.push(`Squad size (${squad.length}) exceeds maximum limit of 25 players.`);
  }
  if (overseasCount > 8) {
    errors.push(`Overseas players (${overseasCount}) exceed maximum limit of 8.`);
  }
  if (currentPurse < 0) {
    errors.push(`Purse limit exceeded: negative balance (${currentPurse.toFixed(2)} Cr).`);
  }

  if (squad.length < 12) {
    warnings.push(`Squad size (${squad.length}) is below the minimum required 12 players.`);
  }

  const hasKeeper = squad.some(p => p.is_wicketkeeper);
  if (!hasKeeper && squad.length > 0) {
    warnings.push('No Wicketkeeper in squad. You need a designated keeper in the Playing XI.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    roleCounts,
    overseasCount
  };
}

// Global Rooms memory
const rooms = {};

// Helper to extract serializable room state
function getRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    clients: Array.from(room.clients.values()),
    started: room.started,
    isPaused: room.isPaused,
    auctionStatus: room.auctionStatus,
    players: room.players,
    teams: room.teams,
    currentPlayerIndex: room.currentPlayerIndex,
    currentBid: room.currentBid,
    currentBidderId: room.currentBidderId,
    timer: room.timer,
    logs: room.logs,
    lastWinner: room.lastWinner
  };
}

// Find room and client by socket ID
function findRoomBySocket(socketId) {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.clients.has(socketId)) {
      return room;
    }
  }
  return null;
}

// AI Opponent Bidding Roll Logic
function simulateAIBids(room) {
  const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
  const p = activePool[room.currentPlayerIndex];
  if (!p) return;

  const nextBid = getNextBidAmount(room.currentBid, p.base_price);

  // Compute claimed team IDs
  const claimedTeamIds = Array.from(room.clients.values()).map(c => c.teamId).filter(Boolean);
  const aiTeams = room.teams.filter(t => !claimedTeamIds.includes(t.id));
  const interestedTeams = [];

  aiTeams.forEach(t => {
    const squadRep = analyzeSquad(t.players, t.purse);
    const isOverseasLimit = p.overseas && squadRep.overseasCount >= 8;
    const isSquadLimit = t.players.length >= 25;
    
    // Minimum budget protection check:
    const slotsToMin = Math.max(0, 12 - t.players.length);
    const minRequiredReserve = slotsToMin * 0.20;
    const hasBudget = t.purse - nextBid >= minRequiredReserve && t.purse >= nextBid;

    if (isOverseasLimit || isSquadLimit || !hasBudget) return;

    // AI Valuation logic
    let ratingMultiplier = 1.0 + (p.rating - 50) / 7.5; 
    let purseFactor = Math.min(1.0, t.purse / 100.0);
    if (t.purse < 15.0) {
      purseFactor = 0.5 + (t.purse / 30.0);
    }
    
    let needBoost = 1.0;
    const roleCount = squadRep.roleCounts[p.role] || 0;
    if (roleCount === 0) {
      needBoost = 1.4;
    } else if (roleCount >= 4) {
      needBoost = 0.5;
    }

    let vMax = p.base_price * ratingMultiplier * purseFactor * needBoost;
    vMax = parseFloat(Math.max(p.base_price, vMax).toFixed(2));

    if (nextBid <= vMax && room.currentBidderId !== t.id) {
      interestedTeams.push({ team: t, valuation: vMax });
    }
  });

  if (interestedTeams.length === 0) return null;

  interestedTeams.sort((a, b) => b.valuation - a.valuation);
  const chosen = interestedTeams[0].team;

  room.currentBid = nextBid;
  room.currentBidderId = chosen.id;
  room.logs.unshift(`${chosen.shortName} bids ${nextBid.toFixed(2)} Cr`);
  
  if (room.timer < 8) {
    room.timer = 8;
  }

  return chosen.id;
}

// Timer Countdown & End Handling
function handleTimerEnd(room, io) {
  const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
  const p = activePool[room.currentPlayerIndex];
  if (!p) return;

  if (room.currentBidderId) {
    // SOLD!
    const winningTeam = room.teams.find(t => t.id === room.currentBidderId);
    if (winningTeam) {
      room.lastWinner = { player: p, team: winningTeam, price: room.currentBid };
      room.auctionStatus = 'sold_splash';
      room.isPaused = true;

      // Update player status in pool
      room.players = room.players.map(pl => {
        if (pl.id === p.id) {
          return { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: room.currentBid };
        }
        return pl;
      });

      // Deduct purse and add player to squad
      room.teams = room.teams.map(t => {
        if (t.id === winningTeam.id) {
          return {
            ...t,
            purse: parseFloat((t.purse - room.currentBid).toFixed(2)),
            players: [...t.players, { ...p, status: 'sold', sold_to: winningTeam.id, sold_price: room.currentBid }]
          };
        }
        return t;
      });

      room.logs.unshift(`SOLD! ${p.name} bought by ${winningTeam.name} for ${room.currentBid.toFixed(2)} Cr!`);
    }
  } else {
    // UNSOLD
    room.auctionStatus = 'unsold_splash';
    room.isPaused = true;

    // Update player status
    room.players = room.players.map(pl => {
      if (pl.id === p.id) {
        return { ...pl, status: 'unsold' };
      }
      return pl;
    });

    room.logs.unshift(`PASSED: ${p.name} goes unsold.`);
  }

  io.to(room.code).emit('timer_end', {
    players: room.players,
    teams: room.teams,
    auctionStatus: room.auctionStatus,
    lastWinner: room.lastWinner,
    logs: room.logs
  });
}

function startRoomTimer(room, io) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  room.timerInterval = setInterval(() => {
    if (!room.started || room.isPaused || room.auctionStatus !== 'bidding') return;

    if (room.timer > 0) {
      room.timer--;
      
      // AI Bidding tick: 45% chance on each second if there are AI teams
      const claimedTeamIds = Array.from(room.clients.values()).map(c => c.teamId).filter(Boolean);
      const hasAITeams = room.teams.some(t => !claimedTeamIds.includes(t.id));
      let aiBidMade = false;

      if (hasAITeams && Math.random() < 0.45) {
        const bidderId = simulateAIBids(room);
        if (bidderId) {
          aiBidMade = true;
        }
      }
      
      io.to(room.code).emit('timer_tick', {
        timer: room.timer,
        currentBid: room.currentBid,
        currentBidderId: room.currentBidderId,
        logs: room.logs,
        aiBidMade
      });
    } else {
      handleTimerEnd(room, io);
    }
  }, 1000);
}

// Start NextJS and HTTP + Socket.IO Server
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create Room
    socket.on('create_room', ({ hostName, players, teams }) => {
      // Clean up player in any other room first
      const existingRoom = findRoomBySocket(socket.id);
      if (existingRoom) {
        // Leave previous room
        socket.leave(existingRoom.code);
        existingRoom.clients.delete(socket.id);
      }

      // Generate unique 6-digit room code
      let roomCode;
      do {
        roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      } while (rooms[roomCode]);

      // Initialize room state
      rooms[roomCode] = {
        code: roomCode,
        hostId: socket.id,
        clients: new Map(),
        started: false,
        isPaused: true,
        auctionStatus: 'idle',
        players: players, // Host seeds the initial players list
        teams: teams,     // Host seeds the initial teams list
        currentPlayerIndex: 0,
        currentBid: 0,
        currentBidderId: null,
        timer: 10,
        logs: [`Room created by ${hostName}. Room Code: ${roomCode}`],
        lastWinner: null,
        timerInterval: null
      };

      const room = rooms[roomCode];
      room.clients.set(socket.id, {
        id: socket.id,
        name: hostName,
        teamId: null,
        isHost: true
      });

      socket.join(roomCode);
      socket.emit('room_created', getRoomState(room));
      console.log(`Room created: ${roomCode} by host: ${hostName} (${socket.id})`);
    });

    // Join Room
    socket.on('join_room', ({ roomCode, playerName }) => {
      const room = rooms[roomCode];
      if (!room) {
        socket.emit('join_error', 'Room not found. Please verify the code.');
        return;
      }

      if (room.started) {
        socket.emit('join_error', 'Auction has already started in this room.');
        return;
      }

      // Clean up player in any other room first
      const existingRoom = findRoomBySocket(socket.id);
      if (existingRoom) {
        socket.leave(existingRoom.code);
        existingRoom.clients.delete(socket.id);
      }

      room.clients.set(socket.id, {
        id: socket.id,
        name: playerName,
        teamId: null,
        isHost: false
      });

      socket.join(roomCode);
      room.logs.push(`${playerName} joined the room.`);
      
      socket.emit('room_joined', getRoomState(room));
      socket.to(roomCode).emit('player_joined', {
        clients: Array.from(room.clients.values()),
        logs: room.logs
      });
      
      console.log(`Player ${playerName} (${socket.id}) joined room ${roomCode}`);
    });

    // Claim Team
    socket.on('claim_team', ({ roomCode, teamId }) => {
      const room = rooms[roomCode];
      if (!room) return;

      const client = room.clients.get(socket.id);
      if (!client) return;

      // Check if team is already claimed by another player
      const alreadyClaimed = Array.from(room.clients.values()).some(
        c => c.id !== socket.id && c.teamId === teamId
      );

      if (alreadyClaimed) {
        socket.emit('claim_error', 'Team is already taken by another player.');
        return;
      }

      // If teamId is null, player is unclaiming team
      const prevTeamId = client.teamId;
      client.teamId = teamId;

      // Update room logs
      const teamName = teamId ? room.teams.find(t => t.id === teamId)?.shortName : 'None';
      room.logs.push(`${client.name} selected team: ${teamName}`);

      io.to(roomCode).emit('team_claimed', {
        clients: Array.from(room.clients.values()),
        logs: room.logs
      });
    });

    // Start Auction
    socket.on('start_auction', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      const unclaimedTeamCount = room.teams.length - Array.from(room.clients.values()).filter(c => c.teamId).length;
      console.log(`Starting auction in room: ${roomCode}. AI will manage ${unclaimedTeamCount} teams.`);

      room.started = true;
      room.auctionStatus = 'bidding';
      room.isPaused = false;
      room.currentPlayerIndex = 0;
      room.currentBid = 0;
      room.currentBidderId = null;
      room.timer = 10;
      room.lastWinner = null;

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const p = activePool[room.currentPlayerIndex];
      if (p) {
        room.players = room.players.map(pl => pl.id === p.id ? { ...pl, status: 'active' } : pl);
        room.logs.unshift(`Player under the hammer: ${p.name} (Base Price: ${p.base_price} Cr)`);
      }

      startRoomTimer(room, io);
      io.to(roomCode).emit('state_update', getRoomState(room));
    });

    // Place Bid
    socket.on('place_bid', ({ roomCode, teamId }) => {
      const room = rooms[roomCode];
      if (!room || room.isPaused || room.auctionStatus !== 'bidding') return;

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const p = activePool[room.currentPlayerIndex];
      if (!p) return;

      const nextBid = getNextBidAmount(room.currentBid, p.base_price);
      const team = room.teams.find(t => t.id === teamId);
      if (!team) return;

      // Verify constraints
      const squadRep = analyzeSquad(team.players, team.purse);
      const isOverseasLimit = p.overseas && squadRep.overseasCount >= 8;
      const isSquadLimit = team.players.length >= 25;

      if (isSquadLimit) {
        socket.emit('bid_error', 'Cannot bid. Squad limit of 25 reached.');
        return;
      }
      if (isOverseasLimit) {
        socket.emit('bid_error', 'Cannot bid. Overseas limit of 8 reached.');
        return;
      }
      if (team.purse < nextBid) {
        socket.emit('bid_error', 'Cannot bid. Insufficient purse.');
        return;
      }

      if (room.currentBidderId === teamId) return; // Already holding high bid

      // Update room state
      room.currentBid = nextBid;
      room.currentBidderId = teamId;
      
      const client = room.clients.get(socket.id);
      const bidderName = client ? client.name : team.shortName;
      room.logs.unshift(`${bidderName} (${team.shortName}) bids ${nextBid.toFixed(2)} Cr`);

      if (room.timer < 8) {
        room.timer = 8;
      }

      io.to(roomCode).emit('bid_placed', {
        currentBid: room.currentBid,
        currentBidderId: room.currentBidderId,
        timer: room.timer,
        logs: room.logs
      });
    });

    // Pause Auction
    socket.on('pause_auction', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      room.isPaused = true;
      io.to(roomCode).emit('auction_paused', {
        isPaused: true,
        logs: room.logs
      });
    });

    // Resume Auction
    socket.on('resume_auction', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      room.isPaused = false;
      io.to(roomCode).emit('auction_resumed', {
        isPaused: false,
        logs: room.logs
      });
    });

    // Pass / Skip Player
    socket.on('skip_player', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const p = activePool[room.currentPlayerIndex];
      if (!p) return;

      room.auctionStatus = 'unsold_splash';
      room.isPaused = true;

      room.players = room.players.map(pl => {
        if (pl.id === p.id) {
          return { ...pl, status: 'unsold' };
        }
        return pl;
      });

      room.logs.unshift(`SKIPPED: ${p.name} marked unsold immediately.`);

      io.to(roomCode).emit('state_update', getRoomState(room));
    });

    // Next Player
    socket.on('next_player', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      const remainingPool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      
      if (remainingPool.length <= 1) {
        room.auctionStatus = 'completed';
        room.isPaused = true;
        io.to(roomCode).emit('state_update', getRoomState(room));
        return;
      }

      room.currentBid = 0;
      room.currentBidderId = null;
      room.timer = 10;
      room.auctionStatus = 'bidding';
      room.isPaused = false;
      room.lastWinner = null;

      const nextP = remainingPool[0]; // the previous active player was marked sold/unsold, so it's not in 'pool'/'active' anymore or index shifts
      if (nextP) {
        room.logs.unshift(`Player under the hammer: ${nextP.name} (Base Price: ${nextP.base_price} Cr)`);
        room.players = room.players.map(pl => pl.id === nextP.id ? { ...pl, status: 'active' } : pl);
      }

      startRoomTimer(room, io);
      io.to(roomCode).emit('state_update', getRoomState(room));
    });

    // Fast Solve Bidding War
    socket.on('fast_solve', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id || room.isPaused || room.auctionStatus !== 'bidding') return;

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const activeP = activePool[room.currentPlayerIndex];
      if (!activeP) return;

      let localBid = room.currentBid;
      let localBidderId = room.currentBidderId;
      let activeBidding = true;
      let loopProtect = 0;

      while (activeBidding && loopProtect < 100) {
        loopProtect++;
        const nextBid = getNextBidAmount(localBid, activeP.base_price);
        const bidders = [];

        room.teams.forEach(t => {
          if (t.id === localBidderId) return;

          const squadRep = analyzeSquad(t.players, t.purse);
          const isOverseasLimit = activeP.overseas && squadRep.overseasCount >= 8;
          const isSquadLimit = t.players.length >= 25;
          const slotsToMin = Math.max(0, 12 - t.players.length);
          const minRequiredReserve = slotsToMin * 0.20;
          const hasBudget = t.purse - nextBid >= minRequiredReserve && t.purse >= nextBid;

          if (isOverseasLimit || isSquadLimit || !hasBudget) return;

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
          const idx = Math.floor(Math.random() * bidders.length);
          localBidderId = bidders[idx];
          localBid = nextBid;
        } else {
          activeBidding = false;
        }
      }

      if (localBidderId) {
        const winningTeam = room.teams.find(t => t.id === localBidderId);
        if (winningTeam) {
          room.lastWinner = { player: activeP, team: winningTeam, price: localBid };
          room.auctionStatus = 'sold_splash';
          room.isPaused = true;
          room.currentBid = localBid;
          room.currentBidderId = localBidderId;

          room.players = room.players.map(pl => pl.id === activeP.id ? { ...pl, status: 'sold', sold_to: winningTeam.id, sold_price: localBid } : pl);

          room.teams = room.teams.map(t => {
            if (t.id === winningTeam.id) {
              return {
                ...t,
                purse: parseFloat((t.purse - localBid).toFixed(2)),
                players: [...t.players, { ...activeP, status: 'sold', sold_to: winningTeam.id, sold_price: localBid }]
              };
            }
            return t;
          });

          room.logs.unshift(`SOLD! (Auto) ${activeP.name} bought by ${winningTeam.name} for ${localBid.toFixed(2)} Cr!`);
        }
      } else {
        room.auctionStatus = 'unsold_splash';
        room.isPaused = true;

        room.players = room.players.map(pl => pl.id === activeP.id ? { ...pl, status: 'unsold' } : pl);
        room.logs.unshift(`PASSED: ${activeP.name} is unsold.`);
      }

      io.to(room.code).emit('state_update', getRoomState(room));
    });

    // Reset Room Auction
    socket.on('reset_auction', ({ roomCode, initialPlayersList, initialTeamsList }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }

      room.started = false;
      room.isPaused = true;
      room.auctionStatus = 'idle';
      room.players = initialPlayersList;
      room.teams = initialTeamsList;
      room.currentPlayerIndex = 0;
      room.currentBid = 0;
      room.currentBidderId = null;
      room.timer = 10;
      room.lastWinner = null;
      room.logs = [`Auction was reset by Host. Lobby is active.`];

      // Reset players selection back to none in lobby
      room.clients.forEach(c => {
        c.teamId = null;
      });

      io.to(roomCode).emit('state_update', getRoomState(room));
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const room = findRoomBySocket(socket.id);
      if (room) {
        const client = room.clients.get(socket.id);
        if (client) {
          room.logs.push(`${client.name} disconnected.`);
          room.clients.delete(socket.id);
        }

        // Check if room is empty
        if (room.clients.size === 0) {
          console.log(`Room ${room.code} is now empty. Deleting...`);
          if (room.timerInterval) {
            clearInterval(room.timerInterval);
          }
          delete rooms[room.code];
        } else {
          // If the disconnected client was the host, reassign host
          if (room.hostId === socket.id) {
            const nextHostId = Array.from(room.clients.keys())[0];
            room.hostId = nextHostId;
            const nextHost = room.clients.get(nextHostId);
            if (nextHost) {
              nextHost.isHost = true;
              room.logs.push(`${nextHost.name} is now the host.`);
            }
          }

          // Emit player left event
          io.to(room.code).emit('player_left', {
            clients: Array.from(room.clients.values()),
            logs: room.logs,
            hostId: room.hostId
          });
        }
      }
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
