import './style.css'
import { circle } from './init'
import { detectBrowser, localRoom } from './local';

import { io } from "socket.io-client";

// Change this according to your own local IP
//var socket = io('http://192.168.1.9:3000');
var socket = io('https://sea-turtle-app-qrpgx.ondigitalocean.app');

var introDismiss = document.querySelector('#introDismiss') as HTMLInputElement;
var helpBtn = document.querySelector('#helpBtn') as HTMLInputElement;

if (document.cookie.indexOf("visited=true") >= 0) {
  document.querySelector('.intro').classList.add("hideIntro");
}

introDismiss.addEventListener('click', () => {
  document.querySelector('.intro')?.classList.add('hideIntro');
})

helpBtn.addEventListener('click', () => {
  document.querySelector('.intro')?.classList.remove('hideIntro');
})


localRoom(socket)
detectBrowser()

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});
