/**
 * index.js - Ponto de Entrada do Servidor
 *
 * Este arquivo configura e inicializa o servidor Express com Socket.IO
 * para o jogo multiplayer em tempo real.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { setupSockets } = require('./sockets');

// Configuração do servidor
const PORT = process.env.PORT || 3000;

// Inicializa o Express
const app = express();

// Cria o servidor HTTP a partir do Express
const server = http.createServer(app);

// Inicializa o Socket.IO anexado ao servidor HTTP
// Configuração permite conexões de qualquer origem (CORS)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// =========================================
// Configuração de Rotas Estáticas
// =========================================

// Serve os arquivos estáticos da pasta 'client'
app.use(express.static(path.join(__dirname, '../client')));

// Rota principal - serve o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// =========================================
// Inicialização do Socket.IO
// =========================================

// Configura os eventos do Socket.IO
setupSockets(io);

// =========================================
// Inicialização do Servidor
// =========================================

server.listen(PORT, () => {
    console.log('=========================================');
    console.log(`    JOGO MULTIPLAYER - SERVIDOR`);
    console.log('=========================================');
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log(`Pressione Ctrl+C para parar o servidor`);
    console.log('=========================================');
});

// Tratamento de erros do servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Erro: A porta ${PORT} já está em uso.`);
        console.error('Tente usar outra porta ou feche o processo que está usando esta porta.');
    } else {
        console.error('Erro no servidor:', error);
    }
    process.exit(1);
});

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
    console.log('\nEncerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado com sucesso.');
        process.exit(0);
    });
});
