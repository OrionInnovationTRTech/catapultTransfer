import './style.css'
import { circle } from './init'
import { joinRoom } from './socket'
import { getIP } from './local';

import { io } from "socket.io-client";

// Change this according to your own local IP
var socket = io('http://192.168.1.10:3000');

getIP()

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});

document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    joinRoom(socket)

})
