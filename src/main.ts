import './style.css'
import { circle } from './init'
import { node } from './init'
import { joinRoom } from './socket'

import { io } from "socket.io-client";

var socket = io('http://10.254.127.14:3000');

circle(document.querySelector('#background')!)
node(document.querySelector('.nodes')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});


document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    joinRoom(socket)
})

////////////////////////////////////////////////////////////
// Socket

