import { createAnswer, createOffer, send } from './rtc';

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
      const fileInput: HTMLInputElement = document.querySelector('#toSend') as HTMLInputElement
      let selectedReceiver: any

      document.getElementById(`${receiver}`)?.addEventListener('click', (e: any) => {
        fileInput.click()
        selectedReceiver = e.composedPath()[0].id
        console.log(selectedReceiver);
      })

      fileInput.addEventListener('change', () => {
        const file = fileInput.files![0].name
        console.log(file);

        socket.emit('ping', selectedReceiver, file)
      })
    }

    //Listen to ping
    socket.on('ping', (senderName: any, senderID: any, file: any) => {
      const message = document.createElement('div')
      message.classList.add('message')
      // Create message
      message.innerHTML = `<p>${senderName} wants to send you <span>${file}</span></p>
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
        createOffer(file).then( callID => {
          socket.emit('accept', senderID, callID)
          message.remove()
        })
      })

      decline.addEventListener('click', () => {
        socket.emit('decline', senderID)
        message.remove()
      })

      console.log(`${senderName} wants to send you ${file}`)
    })

    //// Responses to ping
    
    // Accept response 
    socket.on('accept', (receiverID: any, callID: any) => {
      // Create answer
      createAnswer(callID).then( callID => {
        // Send the file
        send(callID).then( () => {
          // TODO: Close the connection
        })
      })

      console.log(`${receiverID} accepted your ping`);
    })

    // Decline response
    socket.on('decline', (receiverID: any) => {
      const receiverName = participants[receiverID][1]
      console.log(`${receiverName} declined your ping`)
      const message = document.createElement('div')
      message.classList.add('message')

      message.innerHTML = `<p>${receiverName} declined your file trasnfer</p>
                            <div class="messageBtn">
                              <button id="dismiss">Dismiss</button>
                            </div>`

      // Add it as node message                            
      const receiver = document.getElementById(`${receiverID}`)?.parentElement as HTMLElement
      receiver.appendChild(message)

      const dismiss = document.querySelector('#dismiss') as HTMLButtonElement

      dismiss.addEventListener('click', () => {
        message.remove()
      })
    })


    // Hide the login screen
    var room = document.querySelector('.joinRoom');
    room?.classList.toggle('showRoom')
}

async function node(nodeSocket: string, nodeEmoji: string, nodeNick: string) {
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