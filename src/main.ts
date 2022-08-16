import './style.css'
import { circle } from './init'
import { joinRoom } from './socket'
import { initFirebase, createAnswer, createOffer } from './rtc';

import { io } from "socket.io-client";

//var socket = io('10.254.132.66:3000');

circle(document.querySelector('#background')!)

window.addEventListener('resize', () => {
  circle(document.querySelector('#background')!)
});

document.querySelector('.create')?.addEventListener('click', () => {
  createOffer('sa.txt')
  console.log("Offer created");
  
})

document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    //joinRoom(socket)

    const roomInput = document.querySelector('#roomID') as HTMLInputElement

    createAnswer(roomInput.value)
    console.log("Answer created");
})
