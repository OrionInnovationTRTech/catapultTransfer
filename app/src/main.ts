import './style.css'
import { circle } from './init'
import { joinRoom } from './socket'
import { localRoom } from './local';

import { io } from "socket.io-client";

// Change this according to your own local IP
var socket = io('http://10.254.132.218:3000');

localRoom(socket);

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});
