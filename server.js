import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const http = createServer(app);
const io = new Server(http, {
    cors: {
        origin: '*',
    }
})

const port = process.env.PORT || 3000;


io.on('connection', socket => {
    socket.on('join', room => {
        socket.join(room);
        console.log(`${socket.id} joined ${room}`);

        const clients = io.sockets.adapter.rooms.get(room);
        clients.forEach(e => {
            socket.to(room).emit('user joined', e);
        })

    
        socket.on('disconnect', () => {
            console.log(`${socket.id} disconnected from ${room}`);
            socket.to(room).emit('user left', socket.id);
        })
    })
})

http.listen(port, () => {
    console.log(`listening on port ${port}`);
})