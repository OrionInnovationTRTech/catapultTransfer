let participants = {};

export function joinRoom(socket: any) {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const localAnchor = document.querySelector('#localAnchor') as HTMLInputElement
    const localText = document.querySelector('#localText') as HTMLInputElement

    const roomID = roomInput.value


    socket.emit('join', roomID) // Join room  

    socket.on('setup', (data: any) => {
        participants = data;

        localAnchor.innerHTML = participants[socket.id][0]
        localText.innerHTML = participants[socket.id][1]
        
        for (const key in participants) {
          if (key != socket.id) {  
            node(key, participants[key][0], participants[key][1])
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
    socket.on('user joined', (ID: any, emoji: string, nick: string) => {
      console.log(`${ID} joined the room`);

      node(ID, emoji, nick)
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

function node(nodeSocket: string, nodeEmoji: string, nodeNick: string) {
  const container = document.querySelector('.members') as HTMLElement

  const node = document.createElement("div");
  const anchor = document.createElement("a");
  const h2 = document.createElement("h2");

  anchor.id = nodeSocket;
  node.classList.add('node');
  node.classList.add('member');
  
  console.log(nodeEmoji);
  console.log(nodeNick);
  
  anchor.innerHTML = nodeEmoji;
  h2.innerHTML = nodeNick;

  node.appendChild(anchor);
  node.appendChild(h2);
  container.appendChild(node);
}

function removeNode(socket: string) {
  const leaver = document.querySelector(`#${socket}`) as HTMLElement

  leaver.parentElement?.remove()
}