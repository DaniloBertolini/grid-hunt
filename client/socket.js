/**
 * socket.js - Módulo de Comunicação Socket.IO (Cliente)
 * GRID HUNT - Multiplayer Arena
 */

const SocketManager = {
    socket: null,
    playerId: null,
    nickname: null,
    isConnected: false,

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

            // Envia nickname
            socket.emit('setNickname', this.nickname);
            this.updateConnectionStatus(true);
        });

        // Desconexão
        socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
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
            // Efeito visual quando coleta
            if (typeof Game !== 'undefined') {
                Game.showCollectEffect();
            }
        });

        // Placar
        socket.on('scoreboard', (scores) => {
            this.updateScoreboard(scores);
        });

        // Erro
        socket.on('connect_error', (error) => {
            this.updateConnectionStatus(false);
        });
    },

    /**
     * Envia movimento
     */
    sendMove: function (direction) {
        if (this.isConnected && this.socket) {
            this.socket.emit('move', direction);
        }
    },

    /**
     * Atualiza status de conexão na UI
     */
    updateConnectionStatus: function (connected) {
        const badge = document.getElementById('connectionStatus');
        const nicknameEl = document.getElementById('playerNickname');

        if (connected) {
            badge.className = 'connection-badge connected';
            badge.innerHTML = '<span class="status-dot"></span><span class="status-text">ONLINE</span>';
            nicknameEl.textContent = this.nickname;
        } else {
            badge.className = 'connection-badge disconnected';
            badge.innerHTML = '<span class="status-dot"></span><span class="status-text">OFFLINE</span>';
            nicknameEl.textContent = '---';
        }
    },

    /**
     * Atualiza o placar
     */
    updateScoreboard: function (scores) {
        const scoreList = document.getElementById('scoreList');

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
