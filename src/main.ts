import './style.css'
import { circle } from './init'
import { joinRoom } from './socket'
import { initFirebase } from './rtc';

import { io } from "socket.io-client";

var socket = io('10.254.132.66:3000');

circle(document.querySelector('#background')!)
console.log(initFirebase());


window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});


document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    joinRoom(socket)
})

