let participants = {
  'IDs': [],
  'nicks': [],
  'emojis': []
}

export function joinRoom(socket: any) {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const roomID = roomInput.value

    socket.emit('join', roomID) // Join room  

    socket.on('setup', (data: any) => {
        participants = data;
        
        participants.IDs.forEach( (e: string) => {
          if (e != socket.id) {
            node(e, participants.emojis[participants.IDs.indexOf(e)])
            addPing(e)
          }
        })
    })
    
    // Update participants list
    socket.on('update', (data: any) => {
        participants.IDs = data
        console.log(participants);
    })

    // Listen for new participant
    socket.on('user joined', (ID: any, emoji: any) => {
      console.log(`${ID} joined the room`);

      node(ID, emoji)
      addPing(ID)
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

function node(nodeSocket: string, nodeEmoji: string) {
  const container = document.querySelector('.members') as HTMLElement

  const l = document.createElement('li');
  const node = document.createElement("div");
  const anchor = document.createElement("a");

  anchor.id = nodeSocket;
  node.classList.add('node');
  node.classList.add('member');
  
  anchor.innerHTML = nodeEmoji;

  node.appendChild(anchor);
  l.appendChild(node);
  container.appendChild(l);
}

function removeNode(socket: string) {
  const l = document.getElementById(socket) as HTMLElement

  l.innerHTML = ""
  l.remove()
}