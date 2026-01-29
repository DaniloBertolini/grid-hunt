const SocketManager = {
    socket: null,
    playerId: null,
    nickname: null,
    isConnected: false,
    currentRoomId: null,
    currentRoomName: null,

    connect: function (nickname) {
        this.nickname = nickname;
        this.socket = io();
        this.setupEventListeners();
    },

    setupEventListeners: function () {
        const socket = this.socket;

        socket.on('connect', () => {
            this.isConnected = true;
            this.playerId = socket.id;
            socket.emit('setNickname', this.nickname);
        });

        socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        socket.on('roomList', (rooms) => {
            if (typeof Game !== 'undefined') {
                Game.updateRoomList(rooms);
            }
        });

        socket.on('globalVictories', (victories) => {
            if (typeof Game !== 'undefined') {
                Game.updateVictoriesList(victories);
            }
        });

        socket.on('joinedRoom', (data) => {
            this.currentRoomId = data.roomId;
            this.currentRoomName = data.roomName;
            if (typeof Game !== 'undefined') {
                Game.enterGame(data);
            }
        });

        socket.on('leftRoom', () => {
            this.currentRoomId = null;
            this.currentRoomName = null;
            if (typeof Game !== 'undefined') {
                Game.returnToLobby();
            }
        });

        socket.on('roomError', (msg) => {
            alert(msg);
        });

        socket.on('gameState', (state) => {
            if (typeof Game !== 'undefined') {
                Game.updateState(state);
            }
        });

        socket.on('playerJoined', (player) => {
        });

        socket.on('playerLeft', (playerId) => {
        });

        socket.on('foodCollected', (data) => {
            if (typeof Game !== 'undefined') {
                Game.showCollectEffect();
            }
        });

        socket.on('scoreboard', (scores) => {
            this.updateScoreboard(scores);
        });

        socket.on('gameWinner', (data) => {
            if (typeof Game !== 'undefined') {
                Game.showWinnerModal(data);
            }
        });

        socket.on('connect_error', (error) => {
            this.updateConnectionStatus(false);
        });
    },

    createRoom: function (data) {
        if (this.isConnected && this.socket) {
            this.socket.emit('createRoom', data);
        }
    },

    joinRoom: function (roomId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('joinRoom', roomId);
        }
    },

    leaveRoom: function () {
        if (this.isConnected && this.socket) {
            this.socket.emit('leaveRoom');
        }
    },

    refreshRooms: function () {
        if (this.isConnected && this.socket) {
            this.socket.emit('listRooms');
        }
    },

    sendMove: function (direction) {
        if (this.isConnected && this.socket && this.currentRoomId) {
            this.socket.emit('move', direction);
        }
    },

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
