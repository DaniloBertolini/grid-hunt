const gameState = require('./gameState');

const playerNicknames = {};

function setupSockets(io) {

    io.on('connection', (socket) => {

        socket.on('setNickname', (nickname) => {
            const sanitized = String(nickname).trim().substring(0, 15) || 'Jogador';
            playerNicknames[socket.id] = sanitized;

            socket.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        socket.on('listRooms', () => {
            socket.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        socket.on('createRoom', (data) => {
            const nickname = playerNicknames[socket.id] || 'Jogador';
            const roomName = String(data.name || '').trim().substring(0, 20) || `Sala de ${nickname}`;

            const config = {
                maxPoints: Math.min(Math.max(parseInt(data.maxPoints) || 80, 5), 500),
                instantFruit: data.instantFruit !== undefined ? data.instantFruit : true,
                fruitDelay: Math.min(Math.max(parseInt(data.fruitDelay) || 3, 1), 30)
            };

            const room = gameState.createRoom(roomName, socket.id, config);

            gameState.joinRoom(room.id, socket.id, nickname);
            socket.join(room.id);

            socket.emit('joinedRoom', {
                roomId: room.id,
                roomName: room.name,
                config: room.config
            });
            socket.emit('gameState', gameState.getRoomGameState(room.id));
            socket.emit('scoreboard', gameState.getRoomScoreboard(room.id));

            io.emit('roomList', gameState.listRooms());
        });

        socket.on('joinRoom', (roomId) => {
            const nickname = playerNicknames[socket.id] || 'Jogador';
            const player = gameState.joinRoom(roomId, socket.id, nickname);

            if (!player) {
                socket.emit('roomError', 'Sala não encontrada');
                return;
            }

            socket.join(roomId);

            const room = gameState.getPlayerRoom(socket.id);

            socket.emit('joinedRoom', {
                roomId: roomId,
                roomName: room ? room.name : '',
                config: room ? room.config : {}
            });

            socket.emit('gameState', gameState.getRoomGameState(roomId));

            io.to(roomId).emit('playerJoined', player);
            io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
            io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));

            io.emit('roomList', gameState.listRooms());
        });

        socket.on('leaveRoom', () => {
            const roomId = gameState.getPlayerRoomId(socket.id);
            if (!roomId) return;

            const result = gameState.leaveRoom(socket.id);
            socket.leave(roomId);

            socket.emit('leftRoom');

            if (result && !result.deleted) {
                io.to(roomId).emit('playerLeft', socket.id);
                io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
                io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
            }

            io.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        socket.on('move', (direction) => {
            const roomId = gameState.getPlayerRoomId(socket.id);
            if (!roomId) return;

            gameState.movePlayer(socket.id, direction);

            const result = gameState.checkFoodCollision(socket.id);

            if (result.collected) {
                io.to(roomId).emit('foodCollected', {
                    playerId: socket.id,
                    nickname: result.player.nickname,
                    newScore: result.player.score
                });

                if (result.winner) {
                    const winData = gameState.handleWin(socket.id);

                    if (winData) {
                        io.to(roomId).emit('gameWinner', {
                            nickname: winData.winnerNickname,
                            totalWins: winData.wins
                        });

                        io.emit('globalVictories', gameState.getGlobalVictories());
                    }

                    io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
                    io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
                } else {
                    const room = gameState.getPlayerRoom(socket.id);
                    if (room) {
                        if (room.config.instantFruit) {
                            gameState.spawnFood(roomId);
                            io.to(roomId).emit('foodSpawned', gameState.getRoomGameState(roomId).food);
                        } else {
                            gameState.scheduleFood(roomId);
                        }
                    }

                    io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
                }
            }

            io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
        });

        socket.on('disconnect', () => {
            const roomId = gameState.getPlayerRoomId(socket.id);

            if (roomId) {
                const result = gameState.leaveRoom(socket.id);

                if (result && !result.deleted) {
                    io.to(roomId).emit('playerLeft', socket.id);
                    io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
                    io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
                }

                io.emit('roomList', gameState.listRooms());
            }

            delete playerNicknames[socket.id];
        });
    });
}

module.exports = { setupSockets };
