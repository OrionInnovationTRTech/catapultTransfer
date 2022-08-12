let participants: any = {}

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
          if (key !== socket.id) {  
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
      const fileInput: HTMLInputElement = document.querySelector('#toSend') as HTMLInputElement
      let selectedReceiver: any

      document.querySelector(`#${receiver}`)?.addEventListener('click', (e) => {
        fileInput.click() //TODO: There is a weird bug in which id cannot be selected due to a database formatting issue
        selectedReceiver = e.path![0].id
        console.log(selectedReceiver);
      })

      fileInput.addEventListener('change', () => {
        const file = fileInput.files![0].name
        console.log(file);

        socket.emit('ping', selectedReceiver, file)
      })
    }

    //Listen to ping
    socket.on('ping', (name: any, ID: any, file: any) => {
      const message = document.createElement('div')
      message.classList.add('message')
      // Create message
      message.innerHTML = `<p>${name} wants to send you <span>${file}</span></p>
                            <div class="messageBtn">
                              <button id="accept">Accept</button>
                              <button id="decline">Decline</button>
                            </div>`

      const receiver = document.querySelector(`#${ID}`)?.parentElement as HTMLElement

      console.log(receiver);
      receiver.appendChild(message)

      const accept = document.querySelector('#accept') as HTMLButtonElement
      const decline = document.querySelector('#decline') as HTMLButtonElement

      // Add event listeners to buttons
      accept.addEventListener('click', () => {
        socket.emit('accept', ID)
        message.remove()
      })

      decline.addEventListener('click', () => {
        socket.emit('decline', ID)
        message.remove()
      })

      console.log(`${name} wants to send you ${file}`)
    })

    // Hide the login screen
    var room = document.querySelector('.joinRoom');
    room?.classList.toggle('showRoom')
}

function node(nodeSocket: string, nodeEmoji: string, nodeNick: string) {
  const container = document.querySelector('.members') as HTMLElement
  // Create new node
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