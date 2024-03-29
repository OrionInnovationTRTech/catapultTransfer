
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import firebaseConfig from './config'; // Create a Firebase project and add your configs to this file
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, getDocs, query } from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
const database = getFirestore(app);

// ICE servers
const servers = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 
              'stun:stun1.l.google.com:19302'
            ],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Create a new RTCPeerConnection
const peerConnections : {[key: string]: RTCPeerConnection} = {}

const MAX_CHUNK_SIZE = 65536;
const END_OF_MESSAGE = 'EOF';

////////////////////////////////////////////////////////////////////////////////


/////////////////// Receiver Side ////////////////////////////////////////////////////////////////
export async function createOffer(fileName: string, fileSize: any, senderID: string) {
  // Database reference
  const callDocs = collection(database, 'calls');

  // Add offer SDP to the database
  const newDoc = await addDoc(callDocs, {})

  // Create a new RTCPeerConnection
  peerConnections[newDoc.id] = new RTCPeerConnection(servers);
  const peerConnection = peerConnections[newDoc.id];

  //camera
  //const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  //localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Candidates collection reference
  const offerCandidates = collection(newDoc, 'offerCandidates');
  const answerCandidates = collection(newDoc, 'answerCandidates');

  // Establish connection and create a data channel
  const dataChannel = peerConnection.createDataChannel(fileName);
  dataChannel.binaryType = 'arraybuffer';
  dataChannel.onbufferedamountlow = null;

  // Array for the file
  const receivedBuffers: any = [];
  let receivedBytes = 0;

  // Add progress bar
  addProgress(senderID);

  dataChannel.onopen = () => {
    console.log('Data channel for receiving');
  }

  // Listen for message from data channel
  dataChannel.onmessage = event => {
    // Download file
    const { data } = event

    try {
      if (data !== END_OF_MESSAGE) {
        // Add to array
        receivedBuffers.push(data);
        receivedBytes += data.byteLength;
      
        console.log(`Received ${receivedBytes} bytes of ${fileSize}`);
        progress(receivedBytes, fileSize, senderID);
      }
      else {
        progress(receivedBytes, fileSize, senderID);

        const file = new File(receivedBuffers, fileName);
        //const file = new Blob(receivedBuffers, { type: 'applicati§/octet-stream' });
      
        downloadFile(file, fileName).then( () => {
          closeConnection(newDoc.id);

          console.log('File downloaded')
          const message = "File has been downloaded successfully!";

          document.getElementById(senderID)!.dataset.issending = 'false'

          addMessage(senderID, message);
        })
        
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Add offer candidates to the database
  peerConnection.onicecandidate = event => {
    event.candidate && addDoc(offerCandidates, event.candidate?.toJSON());
  }

  // Listen for connection state
  peerConnection.onconnectionstatechange = () => {
    switch (peerConnection.connectionState) {
      case 'disconnected':
        justCloseConnection(newDoc.id);

        document.getElementById(senderID)!.dataset.issending = 'false'

        removeProgress(senderID);

        break;
      case 'failed': 
        console.log('Connection failed');
        closeConnection(newDoc.id);
        addMessage(senderID, 'File could not be received');

        document.getElementById(senderID)!.dataset.issending = 'false'

        break
    }
  }

  // Create an offer and set it as local description
  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // Create offer SDP
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type
  }

  // Add offer SDP to the database
  await updateDoc(newDoc, { offer });

  // Listen for remote answer SDP
  onSnapshot(newDoc, snapshot => {
    const data = snapshot.data();
    
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      // Set remote description
      peerConnection.setRemoteDescription(new RTCSessionDescription(data?.answer));
    }
    
  })

  // Listen for remote ICE candidates
  onSnapshot(answerCandidates, snapshot => {
    
    snapshot.docChanges().forEach(change => {
    
      // If there is a new candidate, add it to the peerConnection
      if (change.type === 'added') {
        try {
          const candidate = new RTCIceCandidate(change.doc.data());    
          peerConnection.addIceCandidate(candidate);
        }
        catch (error) {
          console.log(error);
        }
      }
    })
  })

  return newDoc.id;
}

/////////////////// Sender Side ////////////////////////////////////////////////////////////////
export async function createAnswer(offerID: string, receiverID: string) {
  // Create a new RTCPeerConnection
  peerConnections[offerID] = new RTCPeerConnection(servers);
  const peerConnection = peerConnections[offerID];

  //camera
  //const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  //localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Get references to incoming call
  const callDocs = doc(database, 'calls', offerID);
  const answerCandidates = collection(callDocs, 'answerCandidates');
  const offerCandidates = collection(callDocs, 'offerCandidates');

  // Listen for ICE candidates
  peerConnection.onicecandidate = event => {
    event.candidate && addDoc(answerCandidates, event.candidate?.toJSON());
  } // In the event of a ICE candidate, save it to the database

  // Get the data from incoming call
  const incomingCall = (await getDoc(callDocs)).data();

  // Set the offer as remote description
  const offerDescription = incomingCall?.offer;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

  // Create an answer and set it as local description
  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);

  // Create answer SDP
  const answer = {
    sdp: answerDescription.sdp,
    type: answerDescription.type
  }

  await updateDoc(callDocs, { answer });

  // Listen for remote ICE candidates
  onSnapshot(offerCandidates, snapshot => {
    
    snapshot.docChanges().forEach(change => {
      
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection.addIceCandidate(candidate);
      }
    })
  })

  // Add progress bar
  addProgress(receiverID)

  return offerID;
}

export async function send(callID: string, receiverID: string) {  
  // Listen for connection state
  peerConnections[callID].onconnectionstatechange = () => {
    switch (peerConnections[callID].connectionState) {
      // If remote peer has received the file, it will disconnect, so close the connection
      case 'disconnected':
        justCloseConnection(callID);

        document.getElementById(receiverID)!.dataset.issending = 'false'
        break;

      // If the connection failed, close the connection  
      case 'failed': 
        console.log('Connection failed');
        closeConnection(callID);
        addMessage(receiverID, 'File could not be sent');

        removeProgress(receiverID);
        document.getElementById(receiverID)!.dataset.issending = 'false'
        break;
    }
  }

  peerConnections[callID].ondatachannel = event => {
    // Fetch the file input 
    const fileInput = document.getElementById(`${receiverID}input`) as HTMLInputElement;
    const file = fileInput.files![0]

    const dataChannel = event.channel;

    dataChannel.binaryType = 'arraybuffer';

    // Listen for open data channel
    dataChannel.onopen = async () => { 
      console.log('dataChannel open for sending');

      // If file is is bigget than 1 GB, it might take a while to send it
      // So, show a message indicating that waiting is normal
      if (file.size > 1000000000) {
        addMessage(receiverID, 'Preparing file...');
      }
      
      const arrayBuffer = await file.arrayBuffer()

      if (file.size > 1000000000) {
        const dismiss = document.getElementById(`${receiverID}dismiss`) as HTMLButtonElement;
        dismiss.parentElement?.parentElement?.remove()
      }

      const MAX_BUFFERED_AMOUNT = dataChannel.bufferedAmountLowThreshold = arrayBuffer.byteLength / 100;
    
      for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK_SIZE) {   
        if (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          await new Promise(resolve => { dataChannel.onbufferedamountlow = resolve });
        }

        // Send the chunk by slicing it
        const slice = arrayBuffer.slice(i, i + MAX_CHUNK_SIZE);

        dataChannel.send(slice);

        console.log(`Sending chunk ${i} of ${arrayBuffer.byteLength}`);
        
        // If progress cannot be updated, it means that the node is longer connected
        if (!progress(i, arrayBuffer.byteLength, receiverID)) {
          // Close the connection for the node who left the call
          justCloseConnection(callID);

          // Remove the progress bar
          removeProgress(receiverID);
          return
        }
      }


      progress(arrayBuffer.byteLength, arrayBuffer.byteLength, receiverID);
      addMessage(receiverID, "File has been sent successfully!");

      document.getElementById(receiverID)!.dataset.issending = 'false'

      dataChannel.send(END_OF_MESSAGE)
    }
  }
}

async function closeConnection(callID: string) {
  // Close the connection when the file is sent
  peerConnections[callID].close();
  delete peerConnections[callID];
  console.log(`Connection ${callID} closed`)

  // Delete firebase documents
  const callDocs = doc(database, 'calls', callID);

  // Delete answer candidates
  const answerQuery = query(collection(callDocs, 'answerCandidates'));
  const answerSnapshot = await getDocs(answerQuery);

  answerSnapshot.forEach(doc => {
    deleteDoc(doc.ref);
  })

  // Delete offer candidates
  const offerQuery = query(collection(callDocs, 'offerCandidates'));
  const offerSnapshot = await getDocs(offerQuery);

  offerSnapshot.forEach(doc => {
    deleteDoc(doc.ref);
  })
  
  // Delete call document
  deleteDoc(callDocs);
}

async function justCloseConnection(callID: string) {
  // Close the connection when the file is sent
  peerConnections[callID].close();
  delete peerConnections[callID];
  console.log(`Connection ${callID} closed`)
}

async function downloadFile(file: File, fileName: string) {
  const a = document.createElement('a');
  a.download = fileName;

  const URL = window.URL || window.webkitURL;
  a.href = URL.createObjectURL(file);

  

  a.click();
  a.remove();
}

function progress(current: number, total: number, receiverID: string) {
  const bar = document.getElementById(`${receiverID}progress`) as HTMLDivElement;
  const progress = 100 - (current / total) * 100;

  try {
    bar.setAttribute('style', `stroke-dashoffset: ${progress}`);
    return true
  }
  catch (error) {
    return false;
  }
}

function addProgress(receiverID: string) {
  const progress = document.createElement('div');
  const node = document.getElementById(receiverID)?.parentElement;

  progress.innerHTML = `<svg class="circle-container" viewBox="2 -2 28 36" xmlns="http://www.w3.org/2000/svg">
                          <circle class="circle-container__background" r="16" cx="16" cy="16"></circle>
                          <circle
                            class="circle-container__progress"
                            id="${receiverID}progress"
                            r="16"
                            cx="16"
                            cy="16">
                          </circle>
                        </svg>`

  node?.prepend(progress);                  
}

function removeProgress(receiverID: string) {
  const progress = document.getElementById(`${receiverID}progress`)?.parentElement
  progress?.remove();
}

export function addMessage(receiverID: string, message: string) {
  const messageBox = document.createElement('div')
  messageBox.classList.add('message')

  messageBox.innerHTML = `<p>${message}</p>
                        <div class="messageBtn">
                          <button id="${receiverID}dismiss" class="dismiss">Dismiss</button>
                        </div>`

  // Add it as node message                            
  const receiver = document.getElementById(`${receiverID}`)?.parentElement as HTMLElement
  receiver.appendChild(messageBox)

  const dismiss = document.querySelector('.dismiss') as HTMLButtonElement

  dismiss.addEventListener('click', () => {
    removeProgress(receiverID);
    messageBox.classList.add('messageOut')
    setTimeout(() => {
      messageBox.remove()
    } , 300)
  })
}
