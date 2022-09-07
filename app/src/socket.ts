import { detectBrowser } from './local';
import { addMessage, createAnswer, createOffer, send } from './rtc';

let participants: any = {}

export function joinRoom(socket: any, room: string = 'default') {
    // Get roomID from input
    const roomInput = document.querySelector('#roomID') as HTMLInputElement
    const localAnchor = document.querySelector('#localAnchor') as HTMLInputElement
    const localText = document.querySelector('#localText') as HTMLInputElement

    const roomID = room == 'default' ? roomInput.value : room

    // Clear the room input
    roomInput.value = ''

    if (room == 'default') {
      const roomName = document.querySelector('#roomName') as HTMLHeadingElement;
      roomName.innerHTML = `Room <span>${roomID}</span>` 
    }

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
      let fileInput = document.getElementById(`${receiver}input`) as HTMLInputElement

      fileInput.addEventListener('change', changeListener)

      async function changeListener() {
        const file = fileInput.files![0]
        const fileName = file.name

        let fileLimit = 2145386496

        // Check if file is too big for certain browsers
        switch(detectBrowser()) {
          case 'Safari':
            fileLimit = 4294967296;
            break;
          case 'Firefox':
            fileLimit = 8589934592;
            break;
          default: 
            break;
        }

        console.log(file);

        const fileSize = file.size
        
        if (fileSize > fileLimit) {
          addMessage(receiver, 'File is too large, you can try Firefox...')
          return
        }

        const message = document.createElement('div')
        message.classList.add('message')
        // Create message
        message.innerHTML = `<p>Do you want to send <span>${fileName}</span> to <span>${participants[receiver][1]}</span>?</p>
                          <div class="messageBtn">
                            <button id="accept">Send</button>
                            <button id="decline">Cancel</button>
                          </div>`     
        
        const sender = document.getElementById(`${receiver}`)?.parentElement as HTMLElement
        sender.appendChild(message)

        const accept = document.querySelector('#accept') as HTMLButtonElement
        const decline = document.querySelector('#decline') as HTMLButtonElement

        // Add event listeners to buttons
        accept.addEventListener('click', () => {
          socket.emit('ping', receiver, fileName, fileSize)
          removeMessage()
          
          // Waiting for message Box
          const messageBox = document.createElement('div')
          messageBox.classList.add('message')
          messageBox.id = `${receiver}waiting`
          messageBox.innerHTML = `<p>Waiting for <span>${participants[receiver][1]}</span> to accept...</p>`

          sender.appendChild(messageBox)

          //fileInput.removeEventListener('change', changeListener)
        })

        decline.addEventListener('click', () => {
          removeMessage()
          fileInput.value = ''          
        })


        function removeMessage() {
          message.classList.add('messageOut')
          setTimeout(() => {
            message.remove()
          } , 300)
        }
      }

      // Trigger file input when node is clicked
      document.getElementById(`${receiver}`)?.addEventListener('click', () => fileInput.click() )
    }

    //Listen to ping
    socket.on('ping', (senderName: any, senderID: any, file: any, fileSize: any) => {
      // Check if there are any messages left from the previous pings
      if (document.getElementById(`${senderID}dismiss`)) {
        document.getElementById(`${senderID}dismiss`)?.click()
      }

      const message = document.createElement('div')
      message.classList.add('message')
      // Create message
      message.innerHTML = `<p><span>${senderName}</span> wants to send you <span>${file}</span></p>
                            <div class="messageBtn">
                              <button id="accept">Accept</button>
                              <button id="decline"x>Decline</button>
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
      // Remove waiting message
      const waitMessage = document.getElementById(`${receiverID}waiting`) as HTMLElement

      waitMessage.classList.add('messageOut')
      setTimeout(() => {
        waitMessage.remove()
      } , 300)
      
      // Create answer
      createAnswer(callID, receiverID).then( callID => {
        // Send the file
        send(callID, receiverID)
      })

      console.log(`${receiverID} accepted your ping`);
    })

    // Decline response
    socket.on('decline', (receiverID: any) => {
      const receiverName = participants[receiverID][1]
      const waitMessage = document.getElementById(`${receiverID}waiting`) as HTMLElement

      waitMessage.classList.add('messageOut')
      setTimeout(() => {
        waitMessage.remove()
      } , 300)


      addMessage(receiverID, `${receiverName} declined your request`)
    })

    if (room === 'default') {
      // If it is a customr room
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
  const leaver = document.getElementById(socket) as HTMLElement

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