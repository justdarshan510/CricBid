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

// Analyze squad composition (used for bid validation)
function analyzeSquad(squad) {
  const overseasCount = squad.filter(p => p.overseas).length;
  return { overseasCount };
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
      io.to(room.code).emit('timer_tick', {
        timer: room.timer,
        currentBid: room.currentBid,
        currentBidderId: room.currentBidderId,
        logs: room.logs,
        aiBidMade: false
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

      console.log(`Starting auction in room: ${roomCode}.`);

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
      // Log attempt and return a helpful error when auction not accepting bids
      if (!room) {
        socket.emit('bid_error', 'Room not found.');
        console.debug('[server] place_bid: room not found', { roomCode, socket: socket.id });
        return;
      }
      if (room.isPaused || room.auctionStatus !== 'bidding') {
        socket.emit('bid_error', 'Auction is not accepting bids right now.');
        console.debug('[server] place_bid ignored - auction not accepting bids', { roomCode, socket: socket.id, isPaused: room.isPaused, auctionStatus: room.auctionStatus });
        return;
      }

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const p = activePool[room.currentPlayerIndex];
      if (!p) return;

      const nextBid = getNextBidAmount(room.currentBid, p.base_price);
      const team = room.teams.find(t => t.id === teamId);
      if (!team) {
        socket.emit('bid_error', 'Invalid team.');
        console.debug('[server] place_bid invalid team', { roomCode, teamId });
        return;
      }

      const client = room.clients.get(socket.id);
      if (!client || client.teamId !== teamId) {
        socket.emit('bid_error', 'You must claim the team before bidding.');
        console.debug('[server] place_bid unclaimed team', { roomCode, socket: socket.id, client, teamId });
        return;
      }

      // Verify constraints
      const squadRep = analyzeSquad(team.players);
      const isOverseasLimit = p.overseas && squadRep.overseasCount >= 8;
      const isSquadLimit = team.players.length >= 25;
      if (isSquadLimit) {
        socket.emit('bid_error', 'Squad limit of 25 reached.');
        console.debug('[server] place_bid squad full', { roomCode, teamId });
        return;
      }
      if (isOverseasLimit) {
        socket.emit('bid_error', 'Overseas limit of 8 reached.');
        console.debug('[server] place_bid overseas limit', { roomCode, teamId });
        return;
      }
      if (team.purse < nextBid) {
        socket.emit('bid_error', 'Insufficient purse.');
        console.debug('[server] place_bid insufficient purse', { roomCode, teamId, purse: team.purse, nextBid });
        return;
      }

      // Update room state
      room.currentBid = nextBid;
      room.currentBidderId = teamId;

      const bidderName = client.name;
      room.logs.unshift(`${bidderName} (${team.shortName}) bids ${nextBid.toFixed(2)} Cr`);

      if (room.timer < 8) room.timer = 8;

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
    socket.on('next_player', ({ roomCode, overrideName, overrideBasePrice }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      // Handle custom voice overrides for injecting/reordering players
      if (overrideName) {
        const cleanName = overrideName.toLowerCase().trim();
        // Look up player case-insensitively in remaining pool or unsold
        const targetIndex = room.players.findIndex(p => 
          (p.status === 'pool' || p.status === 'unsold' || p.status === 'active') &&
          p.name.toLowerCase().includes(cleanName)
        );

        if (targetIndex !== -1) {
          const targetPlayer = room.players[targetIndex];
          // Reactivate player and optional base price override
          targetPlayer.status = 'pool';
          if (overrideBasePrice !== undefined && !isNaN(overrideBasePrice)) {
            targetPlayer.base_price = overrideBasePrice;
          }

          // Move player to the top of the remaining pool
          room.players.splice(targetIndex, 1);
          let insertIndex = room.players.findIndex(p => p.status === 'pool');
          if (insertIndex === -1) insertIndex = 0;
          room.players.splice(insertIndex, 0, targetPlayer);
          
          room.logs.unshift(`Voice Override: Bringing up ${targetPlayer.name} next!`);
        }
      }

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

      const nextP = remainingPool[0];
      if (nextP) {
        room.logs.unshift(`Player under the hammer: ${nextP.name} (Base Price: ${nextP.base_price} Cr)`);
        room.players = room.players.map(pl => pl.id === nextP.id ? { ...pl, status: 'active' } : pl);
      }

      startRoomTimer(room, io);
      io.to(roomCode).emit('state_update', getRoomState(room));
    });

    // Force Sell Player (Voice commanded immediate sale)
    socket.on('force_sell', ({ roomCode, teamId, amount }) => {
      const room = rooms[roomCode];
      if (!room || room.hostId !== socket.id) return;

      const activePool = room.players.filter(p => p.status === 'pool' || p.status === 'active');
      const p = activePool[room.currentPlayerIndex];
      if (!p) return;

      // Deduct/verify purse and squad parameters
      const team = room.teams.find(t => t.id === teamId);
      if (!team) return;

      // Update room state for sale
      room.currentBid = amount;
      room.currentBidderId = teamId;

      room.logs.unshift(`Voice Action: Manual force sale initiated by Host.`);

      // Trigger automatic sale processing and broadcast
      handleTimerEnd(room, io);
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
