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
        const list = Array.from(clients);

        socket.emit('setup', list)
        socket.to(room).emit('update', list)

        socket.to(room).emit('user joined', socket.id);
    
        socket.on('disconnect', () => {
            console.log(`${socket.id} disconnected from ${room}`);
            socket.to(room).emit('user left', socket.id);

            socket.emit('update', list)
            socket.to(room).emit('update', list)
        })

        //Ping
        socket.on('ping', (data) => {
            console.log(`${socket.id} pinged ${data}`);

            socket.to(data).emit('ping', socket.id);
        })
    })
})

http.listen(port, () => {
    console.log(`listening on port ${port}`);
})
