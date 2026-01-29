const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { setupSockets } = require('./sockets');

const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

setupSockets(io);

server.listen(PORT, () => {
    console.log('=========================================');
    console.log(`    JOGO MULTIPLAYER - SERVIDOR`);
    console.log('=========================================');
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log(`Pressione Ctrl+C para parar o servidor`);
    console.log('=========================================');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Erro: A porta ${PORT} já está em uso.`);
        console.error('Tente usar outra porta ou feche o processo que está usando esta porta.');
    } else {
        console.error('Erro no servidor:', error);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\nEncerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado com sucesso.');
        process.exit(0);
    });
});
