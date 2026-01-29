/**
 * socket.js - Módulo de Comunicação Socket.IO (Cliente)
 * GRID HUNT - Multiplayer Arena com Sistema de Salas
 */

const SocketManager = {
    socket: null,
    playerId: null,
    nickname: null,
    isConnected: false,
    currentRoomId: null,
    currentRoomName: null,

    /**
     * Inicializa a conexão com o servidor
     */
    connect: function (nickname) {
        this.nickname = nickname;
        this.socket = io();
        this.setupEventListeners();
    },

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners: function () {
        const socket = this.socket;

        // Conexão estabelecida
        socket.on('connect', () => {
            this.isConnected = true;
            this.playerId = socket.id;
            socket.emit('setNickname', this.nickname);
        });

        // Desconexão
        socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        // Lista de salas
        socket.on('roomList', (rooms) => {
            if (typeof Game !== 'undefined') {
                Game.updateRoomList(rooms);
            }
        });

        // Vitórias globais
        socket.on('globalVictories', (victories) => {
            if (typeof Game !== 'undefined') {
                Game.updateVictoriesList(victories);
            }
        });

        // Entrou em uma sala
        socket.on('joinedRoom', (data) => {
            this.currentRoomId = data.roomId;
            this.currentRoomName = data.roomName;
            if (typeof Game !== 'undefined') {
                Game.enterGame(data);
            }
        });

        // Saiu da sala (voltou ao lobby)
        socket.on('leftRoom', () => {
            this.currentRoomId = null;
            this.currentRoomName = null;
            if (typeof Game !== 'undefined') {
                Game.returnToLobby();
            }
        });

        // Erro de sala
        socket.on('roomError', (msg) => {
            alert(msg);
        });

        // Estado do jogo
        socket.on('gameState', (state) => {
            if (typeof Game !== 'undefined') {
                Game.updateState(state);
            }
        });

        // Novo jogador
        socket.on('playerJoined', (player) => {
        });

        // Jogador saiu
        socket.on('playerLeft', (playerId) => {
        });

        // Comida coletada
        socket.on('foodCollected', (data) => {
            if (typeof Game !== 'undefined') {
                Game.showCollectEffect();
            }
        });

        // Placar
        socket.on('scoreboard', (scores) => {
            this.updateScoreboard(scores);
        });

        // Alguém venceu
        socket.on('gameWinner', (data) => {
            if (typeof Game !== 'undefined') {
                Game.showWinnerModal(data);
            }
        });

        // Erro de conexão
        socket.on('connect_error', (error) => {
            this.updateConnectionStatus(false);
        });
    },

    /**
     * Cria uma sala
     */
    createRoom: function (data) {
        if (this.isConnected && this.socket) {
            this.socket.emit('createRoom', data);
        }
    },

    /**
     * Entra em uma sala
     */
    joinRoom: function (roomId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('joinRoom', roomId);
        }
    },

    /**
     * Sai da sala
     */
    leaveRoom: function () {
        if (this.isConnected && this.socket) {
            this.socket.emit('leaveRoom');
        }
    },

    /**
     * Pede lista de salas atualizada
     */
    refreshRooms: function () {
        if (this.isConnected && this.socket) {
            this.socket.emit('listRooms');
        }
    },

    /**
     * Envia movimento
     */
    sendMove: function (direction) {
        if (this.isConnected && this.socket && this.currentRoomId) {
            this.socket.emit('move', direction);
        }
    },

    /**
     * Atualiza status de conexão na UI
     */
    updateConnectionStatus: function (connected) {
        const badge = document.getElementById('connectionStatus');
        const nicknameEl = document.getElementById('playerNickname');
        if (!badge) return;

        if (connected) {
            badge.className = 'connection-badge connected';
            badge.innerHTML = '<span class="status-dot"></span><span class="status-text">ONLINE</span>';
            if (nicknameEl) nicknameEl.textContent = this.nickname;
        } else {
            badge.className = 'connection-badge disconnected';
            badge.innerHTML = '<span class="status-dot"></span><span class="status-text">OFFLINE</span>';
            if (nicknameEl) nicknameEl.textContent = '---';
        }
    },

    /**
     * Atualiza o placar
     */
    updateScoreboard: function (scores) {
        const scoreList = document.getElementById('scoreList');
        if (!scoreList) return;

        if (scores.length === 0) {
            scoreList.innerHTML = `
                <div class="empty-state">
                    <span class="loading-spinner"></span>
                    <p>Aguardando jogadores...</p>
                </div>
            `;
            return;
        }

        let html = '';
        scores.forEach((player, index) => {
            const isCurrentPlayer = this.playerId === player.id;
            const itemClass = isCurrentPlayer ? 'score-item current-player' : 'score-item';

            html += `
                <div class="${itemClass}">
                    <span class="score-rank">#${index + 1}</span>
                    <div class="score-info">
                        <span class="score-name">${player.nickname}</span>
                    </div>
                    <span class="score-value">${player.score}</span>
                </div>
            `;
        });

        scoreList.innerHTML = html;
    }
};
