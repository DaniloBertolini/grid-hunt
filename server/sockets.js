/**
 * sockets.js - Gerenciamento de Eventos Socket.IO
 *
 * Este módulo configura todos os eventos de comunicação em tempo real
 * entre o servidor e os clientes conectados.
 */

const gameState = require('./gameState');

/**
 * Configura os eventos do Socket.IO
 * @param {object} io - Instância do Socket.IO Server
 */
function setupSockets(io) {
    // Gera a primeira comida quando o servidor inicia
    gameState.spawnFood();

    // Evento disparado quando um novo cliente se conecta
    io.on('connection', (socket) => {

        // Adiciona o jogador ao estado do jogo (nickname será definido depois)
        gameState.addPlayer(socket.id);

        // Envia o estado inicial do jogo para o novo jogador
        socket.emit('gameState', gameState.getGameState());

        // =========================================
        // EVENTO: Definir Nickname
        // =========================================
        socket.on('setNickname', (nickname) => {
            // Valida e sanitiza o nickname
            const sanitizedNickname = String(nickname).trim().substring(0, 15) || 'Jogador';

            gameState.setPlayerNickname(socket.id, sanitizedNickname);

            // Notifica todos os jogadores sobre o novo jogador
            io.emit('playerJoined', gameState.getGameState().players[socket.id]);

            // Envia o placar atualizado para todos
            io.emit('scoreboard', gameState.getScoreboard());

            // Envia o estado atualizado para todos
            io.emit('gameState', gameState.getGameState());
        });

        // =========================================
        // EVENTO: Movimento do Jogador
        // =========================================
        socket.on('move', (direction) => {
            // Atualiza a posição do jogador no estado do jogo
            gameState.movePlayer(socket.id, direction);

            // Verifica se o jogador coletou a comida
            const collectedFood = gameState.checkFoodCollision(socket.id);

            if (collectedFood) {
                // Notifica todos sobre a coleta de comida
                const player = gameState.getGameState().players[socket.id];
                io.emit('foodCollected', {
                    playerId: socket.id,
                    nickname: player.nickname,
                    newScore: player.score
                });

                // Gera nova comida imediatamente após a coleta
                gameState.spawnFood();
                io.emit('foodSpawned', gameState.getGameState().food);

                // Atualiza o placar para todos
                io.emit('scoreboard', gameState.getScoreboard());
            }

            // Envia o estado atualizado para todos os jogadores
            // Nota: Em um jogo maior, seria melhor enviar apenas as mudanças
            io.emit('gameState', gameState.getGameState());
        });

        // =========================================
        // EVENTO: Desconexão do Jogador
        // =========================================
        socket.on('disconnect', () => {

            // Remove o jogador do estado do jogo
            gameState.removePlayer(socket.id);

            // Notifica todos sobre a saída do jogador
            io.emit('playerLeft', socket.id);

            // Atualiza o placar para todos
            io.emit('scoreboard', gameState.getScoreboard());

            // Envia o estado atualizado
            io.emit('gameState', gameState.getGameState());
        });
    });
}

module.exports = {
    setupSockets
};
