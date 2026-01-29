/**
 * sockets.js - Gerenciamento de Eventos Socket.IO com Sistema de Salas
 */

const gameState = require('./gameState');

// Armazena nickname dos jogadores conectados (fora de salas)
const playerNicknames = {};

function setupSockets(io) {

    io.on('connection', (socket) => {

        // =========================================
        // EVENTO: Definir Nickname (ao entrar no lobby)
        // =========================================
        socket.on('setNickname', (nickname) => {
            const sanitized = String(nickname).trim().substring(0, 15) || 'Jogador';
            playerNicknames[socket.id] = sanitized;

            // Envia lista de salas e vitórias globais
            socket.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        // =========================================
        // EVENTO: Listar Salas
        // =========================================
        socket.on('listRooms', () => {
            socket.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        // =========================================
        // EVENTO: Criar Sala
        // =========================================
        socket.on('createRoom', (data) => {
            const nickname = playerNicknames[socket.id] || 'Jogador';
            const roomName = String(data.name || '').trim().substring(0, 20) || `Sala de ${nickname}`;

            const config = {
                maxPoints: Math.min(Math.max(parseInt(data.maxPoints) || 80, 5), 500),
                instantFruit: data.instantFruit !== undefined ? data.instantFruit : true,
                fruitDelay: Math.min(Math.max(parseInt(data.fruitDelay) || 3, 1), 30)
            };

            const room = gameState.createRoom(roomName, socket.id, config);

            // Jogador entra na sala automaticamente
            gameState.joinRoom(room.id, socket.id, nickname);
            socket.join(room.id);

            // Envia estado do jogo para o jogador
            socket.emit('joinedRoom', {
                roomId: room.id,
                roomName: room.name,
                config: room.config
            });
            socket.emit('gameState', gameState.getRoomGameState(room.id));
            socket.emit('scoreboard', gameState.getRoomScoreboard(room.id));

            // Atualiza lista de salas para todos no lobby
            io.emit('roomList', gameState.listRooms());
        });

        // =========================================
        // EVENTO: Entrar em Sala Existente
        // =========================================
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

            // Envia estado para o novo jogador
            socket.emit('gameState', gameState.getRoomGameState(roomId));

            // Notifica todos na sala
            io.to(roomId).emit('playerJoined', player);
            io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
            io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));

            // Atualiza lista de salas para todos
            io.emit('roomList', gameState.listRooms());
        });

        // =========================================
        // EVENTO: Sair da Sala (voltar ao lobby)
        // =========================================
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

            // Atualiza lista de salas
            io.emit('roomList', gameState.listRooms());
            socket.emit('globalVictories', gameState.getGlobalVictories());
        });

        // =========================================
        // EVENTO: Movimento do Jogador
        // =========================================
        socket.on('move', (direction) => {
            const roomId = gameState.getPlayerRoomId(socket.id);
            if (!roomId) return;

            gameState.movePlayer(socket.id, direction);

            const result = gameState.checkFoodCollision(socket.id);

            if (result.collected) {
                // Notifica coleta de comida
                io.to(roomId).emit('foodCollected', {
                    playerId: socket.id,
                    nickname: result.player.nickname,
                    newScore: result.player.score
                });

                if (result.winner) {
                    // Alguém venceu!
                    const winData = gameState.handleWin(socket.id);

                    if (winData) {
                        io.to(roomId).emit('gameWinner', {
                            nickname: winData.winnerNickname,
                            totalWins: winData.wins
                        });

                        // Envia vitórias globais atualizadas para todos
                        io.emit('globalVictories', gameState.getGlobalVictories());
                    }

                    // Envia estado resetado
                    io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
                    io.to(roomId).emit('scoreboard', gameState.getRoomScoreboard(roomId));
                } else {
                    // Spawna nova comida (instantâneo ou com delay)
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

            // Envia estado atualizado para todos na sala
            io.to(roomId).emit('gameState', gameState.getRoomGameState(roomId));
        });

        // =========================================
        // EVENTO: Desconexão do Jogador
        // =========================================
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
