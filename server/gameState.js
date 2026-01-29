const MAP_SIZE = 20;
const CELL_SIZE = 30;

const rooms = {};

const playerRooms = {};

const globalVictories = {};

let roomIdCounter = 1;

function createRoom(name, creatorId, config = {}) {
    const roomId = 'room_' + roomIdCounter++;
    const room = {
        id: roomId,
        name: name,
        creatorId: creatorId,
        players: {},
        food: null,
        foodTimer: null,
        config: {
            maxPoints: config.maxPoints || 80,
            instantFruit: config.instantFruit !== undefined ? config.instantFruit : true,
            fruitDelay: config.fruitDelay || 3
        },
        mapSize: MAP_SIZE,
        cellSize: CELL_SIZE,
        gameActive: true
    };

    rooms[roomId] = room;
    return room;
}

function joinRoom(roomId, playerId, nickname) {
    const room = rooms[roomId];
    if (!room) return null;

    const player = {
        id: playerId,
        nickname: nickname,
        x: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        y: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        score: 0
    };

    room.players[playerId] = player;
    playerRooms[playerId] = roomId;

    if (!room.food) {
        spawnFood(roomId);
    }

    return player;
}

function leaveRoom(playerId) {
    const roomId = playerRooms[playerId];
    if (!roomId || !rooms[roomId]) return null;

    const room = rooms[roomId];
    delete room.players[playerId];
    delete playerRooms[playerId];

    if (Object.keys(room.players).length === 0) {
        if (room.foodTimer) {
            clearTimeout(room.foodTimer);
        }
        delete rooms[roomId];
        return { roomId, deleted: true };
    }

    if (room.creatorId === playerId) {
        room.creatorId = Object.keys(room.players)[0];
    }

    return { roomId, deleted: false };
}

function getPlayerRoom(playerId) {
    const roomId = playerRooms[playerId];
    return roomId ? rooms[roomId] : null;
}

function getPlayerRoomId(playerId) {
    return playerRooms[playerId] || null;
}

function movePlayer(playerId, direction) {
    const room = getPlayerRoom(playerId);
    if (!room || !room.gameActive) return;

    const player = room.players[playerId];
    if (!player) return;

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

function spawnFood(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.food = {
        x: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2,
        y: Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2
    };
}

function scheduleFood(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    const delayMs = room.config.fruitDelay * 1000;
    room.foodTimer = setTimeout(() => {
        if (rooms[roomId]) {
            spawnFood(roomId);
        }
    }, delayMs);
}

function checkFoodCollision(playerId) {
    const room = getPlayerRoom(playerId);
    if (!room || !room.food || !room.gameActive) return { collected: false };

    const player = room.players[playerId];
    if (!player) return { collected: false };

    if (player.x === room.food.x && player.y === room.food.y) {
        player.score += 1;
        room.food = null;

        if (player.score >= room.config.maxPoints) {
            return { collected: true, winner: true, player };
        }

        return { collected: true, winner: false, player };
    }

    return { collected: false };
}

function handleWin(playerId) {
    const room = getPlayerRoom(playerId);
    if (!room) return null;

    const winner = room.players[playerId];
    if (!winner) return null;

    const winnerNickname = winner.nickname;

    if (!globalVictories[winnerNickname]) {
        globalVictories[winnerNickname] = { nickname: winnerNickname, wins: 0 };
    }
    globalVictories[winnerNickname].wins += 1;

    Object.values(room.players).forEach(p => {
        p.score = 0;
        p.x = Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2;
        p.y = Math.floor(Math.random() * MAP_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    });

    room.food = null;
    spawnFood(room.id);

    return {
        winnerNickname,
        wins: globalVictories[winnerNickname].wins
    };
}

function getRoomGameState(roomId) {
    const room = rooms[roomId];
    if (!room) return null;

    return {
        players: room.players,
        food: room.food,
        mapSize: room.mapSize,
        cellSize: room.cellSize,
        config: room.config
    };
}

function getRoomScoreboard(roomId) {
    const room = rooms[roomId];
    if (!room) return [];

    return Object.values(room.players)
        .sort((a, b) => b.score - a.score)
        .map(player => ({
            id: player.id,
            nickname: player.nickname,
            score: player.score
        }));
}

function listRooms() {
    return Object.values(rooms).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: Object.keys(room.players).length,
        maxPoints: room.config.maxPoints,
        instantFruit: room.config.instantFruit,
        fruitDelay: room.config.fruitDelay
    }));
}

function getGlobalVictories() {
    return Object.values(globalVictories)
        .sort((a, b) => b.wins - a.wins);
}

module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    getPlayerRoom,
    getPlayerRoomId,
    movePlayer,
    spawnFood,
    scheduleFood,
    checkFoodCollision,
    handleWin,
    getRoomGameState,
    getRoomScoreboard,
    listRooms,
    getGlobalVictories,
    MAP_SIZE,
    CELL_SIZE
};
