import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import data from './data.json' assert {type: 'json'}

const app = express();
const http = createServer(app);
const io = new Server(http, {
    cors: {
        origin: '*',
    }
})



const port = process.env.PORT || 3000;

let participants = {};

io.on('connection', socket => {
    socket.on('join', room => {
        socket.join(room);
        console.log(`${socket.id} joined ${room}`);

        participants[socket.id] = [data.emojis[Math.floor(Math.random() * 300)], data.nicks[Math.floor(Math.random() * data.nicks.length)]];

        console.log(participants);

        socket.emit('setup', participants)
        socket.to(room).emit('update', participants)

        socket.to(room).emit('user joined', socket.id, participants[socket.id][0]);
    
        socket.on('disconnect', () => {
            delete participants[socket.id]

            console.log(`${socket.id} disconnected from ${room}`);
            socket.to(room).emit('user left', socket.id);

            socket.emit('update', participants)
            socket.to(room).emit('update', participants)
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
