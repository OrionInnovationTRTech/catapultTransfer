import './style.css'
import { circle } from './init'
import { detectBrowser, localRoom } from './local';

import { io } from "socket.io-client";

// Change this according to your own local IP
//var socket = io('http://192.168.1.9:3000');
var socket = io('https://fast-mountain-62446.herokuapp.com');

localRoom(socket)
detectBrowser()

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});
