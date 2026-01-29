/**
 * gameState.js - Gerenciamento do Estado do Jogo
 *
 * Este módulo é responsável por manter e manipular o estado global do jogo,
 * incluindo jogadores, comida e pontuação.
 */

// Configurações do mapa
const MAP_SIZE = 20; // Mapa 20x20
const CELL_SIZE = 30; // Tamanho de cada célula em pixels
const FOOD_SPAWN_INTERVAL = 7000; // 7 segundos em milissegundos

// Estado do jogo
const gameState = {
    players: {},  // Objeto que armazena todos os jogadores conectados
    food: null,   // Posição atual da comida
    mapSize: MAP_SIZE,
    cellSize: CELL_SIZE
};

/**
 * Adiciona um novo jogador ao jogo
 * @param {string} id - ID único do jogador (socket.id)
 * @param {string} nickname - Nickname escolhido pelo jogador
 * @returns {object} - Objeto do jogador criado
 */
function addPlayer(id, nickname = 'Jogador') {
    // Posição inicial aleatória dentro do mapa
    const player = {
        id: id,
        nickname: nickname,
        x: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        y: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        score: 0
    };

    gameState.players[id] = player;
    return player;
}

/**
 * Define o nickname de um jogador
 * @param {string} id - ID do jogador
 * @param {string} nickname - Novo nickname
 */
function setPlayerNickname(id, nickname) {
    if (gameState.players[id]) {
        gameState.players[id].nickname = nickname;
    }
}

/**
 * Remove um jogador do jogo
 * @param {string} id - ID do jogador a ser removido
 */
function removePlayer(id) {
    if (gameState.players[id]) {
        delete gameState.players[id];
    }
}

/**
 * Atualiza a posição de um jogador (movimento baseado em grade)
 * @param {string} id - ID do jogador
 * @param {string} direction - Direção do movimento (up, down, left, right)
 */
function movePlayer(id, direction) {
    const player = gameState.players[id];
    if (!player) return;

    // Move uma célula inteira por vez
    const minPos = CELL_SIZE / 2;
    const maxPos = MAP_SIZE * CELL_SIZE - CELL_SIZE / 2;

    switch (direction) {
        case 'up':
            player.y = Math.max(minPos, player.y - CELL_SIZE);
            break;
        case 'down':
            player.y = Math.min(maxPos, player.y + CELL_SIZE);
            break;
        case 'left':
            player.x = Math.max(minPos, player.x - CELL_SIZE);
            break;
        case 'right':
            player.x = Math.min(maxPos, player.x + CELL_SIZE);
            break;
    }
}

/**
 * Gera comida em uma posição aleatória do mapa
 */
function spawnFood() {
    gameState.food = {
        x: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        y: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2
    };
}

/**
 * Verifica se um jogador coletou a comida
 * Como o movimento é baseado em grade, basta verificar se estão na mesma célula
 * @param {string} playerId - ID do jogador
 * @returns {boolean} - true se o jogador coletou a comida
 */
function checkFoodCollision(playerId) {
    const player = gameState.players[playerId];
    if (!player || !gameState.food) return false;

    // No modo grade, verifica se estão na mesma posição (mesma célula)
    if (player.x === gameState.food.x && player.y === gameState.food.y) {
        player.score += 1;
        gameState.food = null; // Remove a comida
        return true;
    }

    return false;
}

/**
 * Retorna o estado atual do jogo
 * @returns {object} - Estado completo do jogo
 */
function getGameState() {
    return {
        players: gameState.players,
        food: gameState.food,
        mapSize: gameState.mapSize,
        cellSize: gameState.cellSize
    };
}

/**
 * Retorna o ranking dos jogadores ordenado por pontuação
 * @returns {array} - Lista de jogadores ordenada por score
 */
function getScoreboard() {
    return Object.values(gameState.players)
        .sort((a, b) => b.score - a.score)
        .map(player => ({
            id: player.id,
            nickname: player.nickname,
            score: player.score
        }));
}

// Exporta as funções e constantes para uso em outros módulos
module.exports = {
    addPlayer,
    removePlayer,
    setPlayerNickname,
    movePlayer,
    spawnFood,
    checkFoodCollision,
    getGameState,
    getScoreboard,
    FOOD_SPAWN_INTERVAL
};
