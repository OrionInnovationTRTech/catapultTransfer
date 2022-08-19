import './style.css'
import { circle } from './init'
import { joinRoom } from './socket'

import { io } from "socket.io-client";

// Change this according to your own local IP
var socket = io('https://fast-mountain-62446.herokuapp.com');

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});

document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    joinRoom(socket)

})
