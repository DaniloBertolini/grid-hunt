/**
 * game.js - Módulo de Renderização do Jogo
 * GRID HUNT - Multiplayer Arena
 * Visual estilo arcade neon com efeitos de glow
 */

const Game = {
    canvas: null,
    ctx: null,
    state: null,
    keysPressed: {},
    animationFrameId: null,
    collectEffect: 0,
    foodPulse: 0,

    // Cores neon
    colors: {
        background: '#0d0d1a',
        gridLines: 'rgba(0, 245, 255, 0.08)',
        gridAccent: 'rgba(0, 245, 255, 0.15)',
        playerSelf: '#00f5ff',      // Cyan neon
        playerOther: '#ff00ff',     // Magenta neon
        food: '#ff6b35',            // Orange neon
        foodGlow: 'rgba(255, 107, 53, 0.5)',
        text: '#ffffff',
        textGlow: 'rgba(255, 255, 255, 0.5)'
    },

    // Configurações visuais
    config: {
        playerRadius: 12,
        foodRadius: 8
    },

    /**
     * Setup do formulário de login
     */
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

            // Transição suave
            const loginScreen = document.getElementById('loginScreen');
            loginScreen.style.opacity = '0';
            loginScreen.style.transition = 'opacity 0.3s ease';

            setTimeout(() => {
                loginScreen.style.display = 'none';
                document.getElementById('gameScreen').style.display = 'flex';
                this.startGame(nickname);
            }, 300);
        });

        nicknameInput.focus();

        // Criar partículas de fundo
        this.createParticles();
    },

    /**
     * Cria partículas flutuantes no fundo
     */
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

        // Adiciona keyframe de animação
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

    /**
     * Inicia o jogo
     */
    startGame: function (nickname) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.setupKeyboardListeners();
        SocketManager.connect(nickname);
        this.startRenderLoop();
    },

    /**
     * Atualiza estado do jogo
     */
    updateState: function (newState) {
        if (!this.state && newState) {
            const canvasSize = newState.mapSize * newState.cellSize;
            this.canvas.width = canvasSize;
            this.canvas.height = canvasSize;
        }
        this.state = newState;
    },

    /**
     * Efeito visual de coleta
     */
    showCollectEffect: function () {
        this.collectEffect = 1;
    },

    /**
     * Listeners de teclado
     */
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

    /**
     * Loop de renderização
     */
    startRenderLoop: function () {
        const gameLoop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    },

    /**
     * Renderiza o jogo
     */
    render: function () {
        if (!this.state || !this.ctx) return;

        const ctx = this.ctx;
        const { mapSize, cellSize, players, food } = this.state;

        // Atualiza animações
        this.foodPulse += 0.05;
        if (this.collectEffect > 0) {
            this.collectEffect -= 0.02;
        }

        // Limpa o canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Efeito de flash na coleta
        if (this.collectEffect > 0) {
            ctx.fillStyle = `rgba(0, 245, 255, ${this.collectEffect * 0.1})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Desenha a grade
        this.drawGrid(mapSize, cellSize);

        // Desenha comida
        if (food) {
            this.drawFood(food.x, food.y);
        }

        // Desenha jogadores
        Object.values(players).forEach((player) => {
            this.drawPlayer(player);
        });
    },

    /**
     * Desenha a grade neon
     */
    drawGrid: function (mapSize, cellSize) {
        const ctx = this.ctx;
        const canvasSize = mapSize * cellSize;

        // Linhas principais
        ctx.strokeStyle = this.colors.gridLines;
        ctx.lineWidth = 1;

        for (let i = 0; i <= mapSize; i++) {
            // Linhas mais brilhantes a cada 5 células
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

    /**
     * Desenha um jogador com efeito neon
     */
    drawPlayer: function (player) {
        const ctx = this.ctx;
        const isCurrentPlayer = SocketManager.playerId === player.id;
        const color = isCurrentPlayer ? this.colors.playerSelf : this.colors.playerOther;

        // Glow externo
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

        // Círculo principal
        ctx.beginPath();
        ctx.arc(player.x, player.y, this.config.playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Borda interna brilhante
        ctx.beginPath();
        ctx.arc(player.x, player.y, this.config.playerRadius - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nickname acima
        const nickname = player.nickname || 'Player';
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 10px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillText(nickname.toUpperCase(), player.x, player.y - this.config.playerRadius - 8);
        ctx.shadowBlur = 0;
    },

    /**
     * Desenha a comida com efeito pulsante
     */
    drawFood: function (x, y) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.foodPulse) * 0.2 + 1;
        const radius = this.config.foodRadius * pulse;

        // Glow pulsante
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        gradient.addColorStop(0, this.colors.foodGlow);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Círculo principal
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.food;
        ctx.shadowColor = this.colors.food;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Brilho interno
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, radius / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
};

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    Game.setupLoginForm();
});
