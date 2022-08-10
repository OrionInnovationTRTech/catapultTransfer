let participants: any;

export function joinRoom(socket: any) {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const roomID = roomInput.value

    socket.emit('join', roomID) // Join room  

    socket.on('setup', (data: any) => {
        participants = data;
        
        participants.forEach( (e: string) => {
          if (e != socket.id) {
            node(e)
            addPing(e)
          }
        })
    })
    
    // Update participants list
    socket.on('update', (data: any) => {
        participants = data
        console.log(participants);
    })

    // Listen for new participant
    socket.on('user joined', (data: any) => {
      console.log(`${data} joined the room`);

      node(data)
      addPing(data)
    })
    // Listen for participant leaving
    socket.on('user left', (data: any) => {
      console.log(`${data} left the room`)

      removeNode(data)
    })  

    // Ping function
    function addPing(receiver: string) {
      document.querySelector(`#${receiver}`)?.addEventListener('click', () => {
        socket.emit('ping', receiver)
      })
    }

    //Listen to ping
    socket.on('ping', (data: any) => {
      console.log(`${data} pinged you`)
    })

    // Hide the login screen
    var room = document.querySelector('.joinRoom');
    room?.classList.toggle('showRoom')
}

const emojis = ['&#128039;', '&#128054;', '&#129418;']

function node(nodeSocket: string) {
  const container = document.querySelector('.members') as HTMLElement
  const randomEl = emojis[Math.floor(Math.random() * emojis.length)]

  let l = document.createElement('li');
  let node = document.createElement("div");
  let anchor = document.createElement("a");

  anchor.id = nodeSocket;
  node.classList.add('node');
  node.classList.add('member');
  
  anchor.innerHTML = randomEl;

  node.appendChild(anchor);
  l.appendChild(node);
  container.appendChild(l);
}

function removeNode(socket: string) {
  const l = document.getElementById(socket) as HTMLElement

  l.innerHTML = ""
  l.remove()
}