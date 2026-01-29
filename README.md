<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Canvas_API-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
</p>

<h1 align="center">GRID HUNT</h1>

<p align="center">
  <strong>Multiplayer Arena em Tempo Real</strong><br>
  Um jogo multiplayer 2D com visual neon cyberpunk, sistema de salas e ranking global.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versão-1.0.0-00f5ff?style=flat-square" />
  <img src="https://img.shields.io/badge/licença-MIT-ff00ff?style=flat-square" />
  <img src="https://img.shields.io/badge/status-jogável-00ff88?style=flat-square" />
</p>

---

## Sobre

**GRID HUNT** é um jogo multiplayer em tempo real onde jogadores competem em uma arena grid coletando frutas para acumular pontos. O primeiro jogador a atingir a meta de pontos vence a partida. O jogo utiliza WebSockets para comunicação instantânea e Canvas API para renderização fluida.

## Funcionalidades

- **Sistema de Salas** &mdash; Crie ou entre em salas com configurações personalizadas
- **Multiplayer em Tempo Real** &mdash; Movimentação sincronizada via Socket.IO
- **Configuração de Partida** &mdash; Defina pontos para vencer e modo de spawn de frutas
- **Spawn de Frutas Configurável** &mdash; Instantâneo ou com delay personalizado (1-30s)
- **Hall da Fama** &mdash; Ranking global de vitórias acumuladas
- **Visual Neon Cyberpunk** &mdash; Estética retro-futurista com efeitos de glow e scanlines
- **Responsivo** &mdash; Interface adaptável para diferentes tamanhos de tela

## Como Jogar

1. Digite seu nome na tela de login
2. No lobby, crie uma sala ou entre em uma existente
3. Use **WASD** ou **setas** para mover seu jogador
4. Colete as frutas que aparecem na arena para ganhar pontos
5. Alcance a meta de pontos antes dos outros jogadores

## Início Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v16 ou superior)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/grid-hunt.git
cd grid-hunt

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

O servidor estará rodando em **http://localhost:3000**

### Modo Desenvolvimento

```bash
npm run dev
```

Utiliza `--watch` do Node.js para reiniciar automaticamente ao detectar mudanças.

## Estrutura do Projeto

```
grid-hunt/
├── client/                  # Frontend
│   ├── index.html           # Página principal (login, lobby, jogo)
│   ├── style.css            # Estilos neon/cyberpunk
│   ├── game.js              # Renderização Canvas e lógica de UI
│   └── socket.js            # Comunicação com o servidor
│
├── server/                  # Backend
│   ├── index.js             # Configuração Express + Socket.IO
│   ├── sockets.js           # Eventos WebSocket (salas, movimento, colisão)
│   └── gameState.js         # Estado do jogo e gerenciamento de salas
│
├── package.json
└── README.md
```

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Node.js** | Runtime do servidor |
| **Express** | Servidor HTTP e arquivos estáticos |
| **Socket.IO** | Comunicação bidirecional em tempo real |
| **Canvas API** | Renderização do jogo no cliente |
| **Vanilla JS** | Lógica do cliente sem frameworks |

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<p align="center">
  Feito com <strong>Node.js</strong> + <strong>Socket.IO</strong> + <strong>Canvas API</strong>
</p>
