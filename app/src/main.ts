import './style.css'
import { circle } from './init'
import { localRoom } from './local';

import { io } from "socket.io-client";
import { progress } from './rtc';

// Change this according to your own local IP
var socket = io('http://10.254.132.218:3000');

localRoom(socket)

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});
