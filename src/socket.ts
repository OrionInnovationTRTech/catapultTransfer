let participants = {};

export function joinRoom(socket: any) {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const localNode = document.querySelector('#localNode') as HTMLInputElement

    const roomID = roomInput.value


    socket.emit('join', roomID) // Join room  

    socket.on('setup', (data: any) => {
        participants = data;

        localNode.innerHTML = participants[socket.id][0]
        
        for (const key in participants) {
          if (key != socket.id) {  
            node(key, participants[key][0])
            addPing(key)
          }
        }
    })
    
    // Update participants list
    socket.on('update', (data: any) => {
        participants = data;
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

function node(nodeSocket: string, nodeEmoji: string) {
  const container = document.querySelector('.members') as HTMLElement

  const l = document.createElement('li');
  const node = document.createElement("div");
  const anchor = document.createElement("a");

  anchor.id = nodeSocket;
  l.id = `${nodeSocket}Li`;
  node.classList.add('node');
  node.classList.add('member');
  
  console.log(nodeEmoji);
  
  anchor.innerHTML = nodeEmoji;

  node.appendChild(anchor);
  l.appendChild(node);
  container.appendChild(l);
}

function removeNode(socket: string) {
  const leaver = document.querySelector(`#${socket}Li`) as HTMLElement

  leaver.innerHTML = ''
  leaver.remove()
}