export function joinRoom(socket: any) {
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const roomID = roomInput.value

    socket.emit('join', roomID)

    socket.on('user joined', (data: any) => {
        console.log(data);
        node(document.querySelector('.nodes')!)
    })

    socket.on('user left', (data: any) => {
      console.log(`${data} left the room`)
    })

    var room = document.querySelector('.joinRoom');
    room?.classList.toggle('showRoom')
}

const emojis = ['&#128039;', '&#128054;', '&#129418;']

export function node(element: HTMLElement) {
  const randomEl = emojis[Math.floor(Math.random() * emojis.length)]

  let node = document.createElement("div");
  node.classList.add('node');
  node.innerHTML = `<a onclick="console.log('a')">${randomEl}</a>`

  element.appendChild(node);
}