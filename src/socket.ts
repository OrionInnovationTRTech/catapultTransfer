export function joinRoom(socket: any) {
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const roomID = roomInput.value

    socket.emit('join', roomID)

    socket.on('user joined', (data: any) => {
        console.log(`${data} joined the room`)
    })

    socket.on('user left', (data: any) => {
      console.log(`${data} left the room`)
    })

    var room = document.querySelector('.joinRoom');
    room?.classList.toggle('showRoom')
}