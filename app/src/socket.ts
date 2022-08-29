import { addMessage, createAnswer, createOffer, send } from './rtc';

let participants: any = {}

export function joinRoom(socket: any, room: string = 'default') {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const localAnchor = document.querySelector('#localAnchor') as HTMLInputElement
    const localText = document.querySelector('#localText') as HTMLInputElement

    const roomID = room == 'default' ? roomInput.value : room

    socket.emit('join', roomID) // Join room  

    socket.on('setup', (data: any) => {
        participants = data;

        localAnchor.innerHTML = participants[socket.id][0]
        localText.innerHTML = participants[socket.id][1]
        
        for (const key in participants) {
          if (key !== socket.id) {  
            node(key, participants[key][0], participants[key][1]).then( () => {
              addPing(key)
            }) 
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

      node(ID, emoji, nick).then( () => {
        addPing(ID)
      })
    })
    // Listen for participant leaving
    socket.on('user left', (data: any) => {
      console.log(`${data} left the room`)

      removeNode(data)
    })  

    // Ping function
    function addPing(receiver: string) {
      let selectedReceiver: any
      let fileInput: any

      document.getElementById(`${receiver}`)?.addEventListener('click', (e: any) => {
        selectedReceiver = e.composedPath()[0].id
        fileInput = document.getElementById(`${selectedReceiver}input`) as HTMLInputElement
        fileInput.click() 

        console.log(selectedReceiver);

        fileInput.addEventListener('change', changeListener)

        async function changeListener() {
          const file = fileInput.files![0]
          const fileName = file.name
          console.log(file);
          const arrayBuffer = await file.arrayBuffer();
          const fileSize = arrayBuffer.byteLength;

          const message = document.createElement('div')
          message.classList.add('message')
          // Create message
          message.innerHTML = `<p>Do you want to send <span>${fileName}<span> to <span>${participants[selectedReceiver][1]}</span></p>
                            <div class="messageBtn">
                              <button id="accept">Send</button>
                              <button id="decline">Cancel</button>
                            </div>`     
          
        const sender = document.getElementById(`${selectedReceiver}`)?.parentElement as HTMLElement
        sender.appendChild(message)

        const accept = document.querySelector('#accept') as HTMLButtonElement
        const decline = document.querySelector('#decline') as HTMLButtonElement

        // Add event listeners to buttons
        accept.addEventListener('click', () => {
          socket.emit('ping', selectedReceiver, fileName, fileSize)
          removeMessage()
          fileInput.removeEventListener('change', changeListener)
        })

        decline.addEventListener('click', () => {
          removeMessage()
          fileInput.removeEventListener('change', changeListener)
        })


        function removeMessage() {
          message.classList.add('messageOut')
          setTimeout(() => {
            message.remove()
          } , 300)
        }

        }
      })
    }

    //Listen to ping
    socket.on('ping', (senderName: any, senderID: any, file: any, fileSize: any) => {
      const message = document.createElement('div')
      message.classList.add('message')
      // Create message
      message.innerHTML = `<p><span>${senderName}</span> wants to send you <span>${file}</span></p>
                            <div class="messageBtn">
                              <button id="accept">Accept</button>
                              <button id="decline">Decline</button>
                            </div>`

      // Add it as node message                    
      const sender = document.getElementById(`${senderID}`)?.parentElement as HTMLElement
      sender.appendChild(message)

      const accept = document.querySelector('#accept') as HTMLButtonElement
      const decline = document.querySelector('#decline') as HTMLButtonElement

      // Add event listeners to buttons
      accept.addEventListener('click', () => {
        createOffer(file, fileSize, senderID).then( callID => {
          socket.emit('accept', senderID, callID)
          removeMessage()
        })
      })

      decline.addEventListener('click', () => {
        socket.emit('decline', senderID)
        removeMessage()
      })


      function removeMessage() {
        message.classList.add('messageOut')
        setTimeout(() => {
          message.remove()
        } , 300)
      }

      console.log(`${senderName} wants to send you ${file}`)
    })

    //// Responses to ping
    
    // Accept response 
    socket.on('accept', (receiverID: any, callID: any) => {
      // Create answer
      createAnswer(callID).then( callID => {
        // Send the file
        send(callID, receiverID)
      })

      console.log(`${receiverID} accepted your ping`);
    })

    // Decline response
    socket.on('decline', (receiverID: any) => {
      const receiverName = participants[receiverID][1]

      addMessage(receiverID, `${receiverName} declined your ping`)
    })

    if (room == 'default') {
      // Hide the login screen
      const login = document.querySelector('.joinRoom');
      login?.classList.toggle('showRoom')
    }
}

async function node(nodeSocket: string, nodeEmoji: string, nodeNick: string) {
  const container = document.querySelector('.members') as HTMLElement
  // Create new node
  const node = document.createElement("div");
  const anchor = document.createElement("a");
  const h2 = document.createElement("h2");

  const input = document.createElement("input");
  input.type = "file";
  input.id = `${nodeSocket}input`;

  anchor.id = nodeSocket;
  node.classList.add('node');
  node.classList.add('member');
  
  console.log(nodeEmoji);
  console.log(nodeNick);
  
  anchor.innerHTML = nodeEmoji;
  h2.innerHTML = nodeNick;

  node.appendChild(anchor);
  node.appendChild(h2);
  node.appendChild(input);
  container.appendChild(node);
}

function removeNode(socket: string) {
  const leaver = document.querySelector(`#${socket}`) as HTMLElement

  leaver.parentElement?.remove()
}

export async function disconnect(socket: any) {
  socket.disconnect()
  socket.removeAllListeners()

  const localAnchor = document.querySelector('#localAnchor') as HTMLInputElement
  const localText = document.querySelector('#localText') as HTMLInputElement
  const members = document.querySelector('.members') as HTMLElement

  localAnchor.innerHTML = ''
  localText.innerHTML = ''
  members.innerHTML = ''

  socket.connect()
}