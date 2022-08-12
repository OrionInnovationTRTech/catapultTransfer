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

        // User joined
        socket.join(room);
        console.log(`${socket.id} joined ${room}`);

        // New data for participants
        let newSocket = {}
        newSocket[socket.id] = [data.emojis[Math.floor(Math.random() * data.emojis.length)], data.nicks[Math.floor(Math.random() * data.nicks.length)]];
    
        // Assign new socket to participants
        participants[room] = {
            ...participants[room],
            ...newSocket
        }

        console.log(participants);

        // Send new data to all participants
        socket.emit('setup', participants[room])
        socket.to(room).emit('update', participants[room])

        // Send join event to all participants
        socket.to(room).emit('user joined', socket.id, participants[room][socket.id][0], participants[room][socket.id][1]);
    
        socket.on('disconnect', () => {
            // Delete socket from participants
            delete participants[room][socket.id]

            // Send leave event to all participants
            console.log(`${socket.id} disconnected from ${room}`);
            socket.to(room).emit('user left', socket.id);

            // Send new data to all participants
            socket.emit('update', participants)
            socket.to(room).emit('update', participants)
        })

        //Ping
        socket.on('ping', (receiver, file) => {
            const senderName = participants[room][socket.id][1];
            const senderID = socket.id;

            console.log(`${socket.id} pinged ${receiver}`);
            console.log(`${senderName} wants to send you ${file}`)

            // Send ping to receiver
            socket.to(receiver).emit('ping', senderName, senderID, file);
        })
    })
})

http.listen(port, () => {
    console.log(`listening on port ${port}`);
})
