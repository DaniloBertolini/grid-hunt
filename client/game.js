const Game = {
    canvas: null,
    ctx: null,
    state: null,
    keysPressed: {},
    animationFrameId: null,
    collectEffect: 0,
    foodPulse: 0,
    currentScreen: 'login',

    colors: {
        background: '#0d0d1a',
        gridLines: 'rgba(0, 245, 255, 0.08)',
        gridAccent: 'rgba(0, 245, 255, 0.15)',
        playerSelf: '#00f5ff',
        playerOther: '#ff00ff',
        food: '#ff6b35',
        foodGlow: 'rgba(255, 107, 53, 0.5)',
        text: '#ffffff',
        textGlow: 'rgba(255, 255, 255, 0.5)'
    },

    config: {
        playerRadius: 12,
        foodRadius: 8
    },

    setupLoginForm: function () {
        const loginForm = document.getElementById('loginForm');
        const nicknameInput = document.getElementById('nicknameInput');

        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nickname = nicknameInput.value.trim();

            if (nickname.length < 1) {
                nicknameInput.focus();
                return;
            }

            const loginScreen = document.getElementById('loginScreen');
            loginScreen.style.opacity = '0';
            loginScreen.style.transition = 'opacity 0.3s ease';

            setTimeout(() => {
                loginScreen.style.display = 'none';
                document.getElementById('lobbyScreen').style.display = 'flex';
                document.getElementById('lobbyNickname').textContent = nickname.toUpperCase();
                this.currentScreen = 'lobby';
                this.initLobby(nickname);
            }, 300);
        });

        nicknameInput.focus();
        this.createParticles();
    },

    initLobby: function (nickname) {
        SocketManager.connect(nickname);

        this.setupCreateRoomForm();

        document.getElementById('refreshRoomsBtn').addEventListener('click', () => {
            SocketManager.refreshRooms();
        });

        const radios = document.querySelectorAll('input[name="fruitSpawn"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const delayGroup = document.getElementById('delayGroup');
                delayGroup.style.display = radio.value === 'delayed' && radio.checked ? 'block' : 'none';
            });
        });
    },

    setupCreateRoomForm: function () {
        const form = document.getElementById('createRoomForm');

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('roomNameInput').value.trim();
            const maxPoints = parseInt(document.getElementById('maxPointsInput').value) || 80;
            const fruitSpawn = document.querySelector('input[name="fruitSpawn"]:checked').value;
            const fruitDelay = parseInt(document.getElementById('fruitDelayInput').value) || 3;

            SocketManager.createRoom({
                name: name || undefined,
                maxPoints: maxPoints,
                instantFruit: fruitSpawn === 'instant',
                fruitDelay: fruitDelay
            });
        });
    },

    updateRoomList: function (rooms) {
        const roomList = document.getElementById('roomList');
        if (!roomList || this.currentScreen === 'game') return;

        if (rooms.length === 0) {
            roomList.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma sala disponível</p>
                    <p class="empty-hint">Crie uma sala para começar!</p>
                </div>
            `;
            return;
        }

        let html = '';
        rooms.forEach(room => {
            const fruitInfo = room.instantFruit ? 'Instantâneo' : `Delay ${room.fruitDelay}s`;
            html += `
                <div class="room-item" data-room-id="${room.id}">
                    <div class="room-item-info">
                        <span class="room-item-name">${room.name}</span>
                        <div class="room-item-details">
                            <span class="room-detail">👥 ${room.playerCount}</span>
                            <span class="room-detail">🎯 ${room.maxPoints} pts</span>
                            <span class="room-detail">🍎 ${fruitInfo}</span>
                        </div>
                    </div>
                    <button class="join-btn" onclick="Game.onJoinRoom('${room.id}')">ENTRAR</button>
                </div>
            `;
        });

        roomList.innerHTML = html;
    },

    updateVictoriesList: function (victories) {
        const victoriesList = document.getElementById('victoriesList');
        if (!victoriesList) return;

        if (victories.length === 0) {
            victoriesList.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma vitória ainda</p>
                    <p class="empty-hint">Seja o primeiro campeão!</p>
                </div>
            `;
            return;
        }

        let html = '';
        victories.forEach((entry, index) => {
            const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
            const medalColor = medalColors[index] || 'var(--text-muted)';
            html += `
                <div class="victory-item">
                    <span class="victory-rank" style="color: ${medalColor}">#${index + 1}</span>
                    <span class="victory-name">${entry.nickname}</span>
                    <span class="victory-wins">${entry.wins} ${entry.wins === 1 ? 'vitória' : 'vitórias'}</span>
                </div>
            `;
        });

        victoriesList.innerHTML = html;
    },

    onJoinRoom: function (roomId) {
        SocketManager.joinRoom(roomId);
    },

    enterGame: function (data) {
        this.currentScreen = 'game';
        this.state = null;

        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';

        document.getElementById('roomNameDisplay').textContent = data.roomName.toUpperCase();
        document.getElementById('roomGoalDisplay').textContent = `META: ${data.config.maxPoints} PTS`;
        document.getElementById('playerNickname').textContent = SocketManager.nickname.toUpperCase();

        if (!this.canvas) {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.setupKeyboardListeners();
            this.startRenderLoop();
        }

        document.getElementById('leaveRoomBtn').onclick = () => {
            SocketManager.leaveRoom();
        };

        SocketManager.updateConnectionStatus(true);
    },

    returnToLobby: function () {
        this.currentScreen = 'lobby';
        this.state = null;

        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'flex';

        document.getElementById('winnerModal').style.display = 'none';
    },

    showWinnerModal: function (data) {
        const modal = document.getElementById('winnerModal');
        document.getElementById('winnerName').textContent = data.nickname.toUpperCase();
        document.getElementById('winnerWins').textContent = `Total de vitórias: ${data.totalWins}`;
        modal.style.display = 'flex';

        setTimeout(() => {
            modal.style.display = 'none';
        }, 4000);
    },

    createParticles: function () {
        const container = document.getElementById('particles');
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: ${Math.random() > 0.5 ? '#00f5ff' : '#ff00ff'};
                border-radius: 50%;
                opacity: ${Math.random() * 0.3 + 0.1};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
                animation-delay: ${Math.random() * -20}s;
            `;
            container.appendChild(particle);
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatParticle {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 0.3; }
                90% { opacity: 0.3; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    },

    updateState: function (newState) {
        if (!newState) return;
        if (this.canvas && !this.state) {
            const canvasSize = newState.mapSize * newState.cellSize;
            this.canvas.width = canvasSize;
            this.canvas.height = canvasSize;
        }
        this.state = newState;
    },

    showCollectEffect: function () {
        this.collectEffect = 1;
    },

    setupKeyboardListeners: function () {
        const keyMap = {
            'w': 'up', 'W': 'up',
            'a': 'left', 'A': 'left',
            's': 'down', 'S': 'down',
            'd': 'right', 'D': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        document.addEventListener('keydown', (event) => {
            if (this.currentScreen !== 'game') return;
            const direction = keyMap[event.key];
            if (direction) {
                event.preventDefault();
                if (!this.keysPressed[direction]) {
                    this.keysPressed[direction] = true;
                    SocketManager.sendMove(direction);
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            const direction = keyMap[event.key];
            if (direction) {
                this.keysPressed[direction] = false;
            }
        });
    },

    startRenderLoop: function () {
        const gameLoop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    },

    render: function () {
        if (!this.state || !this.ctx || this.currentScreen !== 'game') return;

        const ctx = this.ctx;
        const { mapSize, cellSize, players, food } = this.state;

        this.foodPulse += 0.05;
        if (this.collectEffect > 0) {
            this.collectEffect -= 0.02;
        }

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.collectEffect > 0) {
            ctx.fillStyle = `rgba(0, 245, 255, ${this.collectEffect * 0.1})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.drawGrid(mapSize, cellSize);

        if (food) {
            this.drawFood(food.x, food.y);
        }

        Object.values(players).forEach((player) => {
            this.drawPlayer(player);
        });
    },

    drawGrid: function (mapSize, cellSize) {
        const ctx = this.ctx;
        const canvasSize = mapSize * cellSize;

        ctx.strokeStyle = this.colors.gridLines;
        ctx.lineWidth = 1;

        for (let i = 0; i <= mapSize; i++) {
            if (i % 5 === 0) {
                ctx.strokeStyle = this.colors.gridAccent;
            } else {
                ctx.strokeStyle = this.colors.gridLines;
            }

            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvasSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvasSize, i * cellSize);
            ctx.stroke();
        }
    },

    drawPlayer: function (player) {
        const ctx = this.ctx;
        const isCurrentPlayer = SocketManager.playerId === player.id;
        const color = isCurrentPlayer ? this.colors.playerSelf : this.colors.playerOther;

        const gradient = ctx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, this.config.playerRadius * 2.5
        );
        gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(player.x, player.y, this.config.playerRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.x, player.y, this.config.playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(player.x, player.y, this.config.playerRadius - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const nickname = player.nickname || 'Player';
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 10px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillText(nickname.toUpperCase(), player.x, player.y - this.config.playerRadius - 8);
        ctx.shadowBlur = 0;
    },

    drawFood: function (x, y) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.foodPulse) * 0.2 + 1;
        const radius = this.config.foodRadius * pulse;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        gradient.addColorStop(0, this.colors.foodGlow);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.food;
        ctx.shadowColor = this.colors.food;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x - 2, y - 2, radius / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Game.setupLoginForm();
});
