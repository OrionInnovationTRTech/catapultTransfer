
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, updateDoc } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0dI875y3Yc87rnGqQDKsiizOxC6BxfBg",
  authDomain: "plain-webrtc.firebaseapp.com",
  projectId: "plain-webrtc",
  storageBucket: "plain-webrtc.appspot.com",
  messagingSenderId: "243377585279",
  appId: "1:243377585279:web:21b64ad1d44a6e0079934a",
  measurementId: "G-07B1J2JET4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
const database = getFirestore(app);

// ICE servers
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Create a new RTCPeerConnection
const peerConnections : {[key: string]: RTCPeerConnection} = {}

const MAX_CHUNK_SIZE = 16384;
const END_OF_MESSAGE = 'EOF';

////////////////////////////////////////////////////////////////////////////////

export async function createOffer(fileName: string) {
  // Database reference
  const callDocs = collection(database, 'calls');

  // Add offer SDP to the database
  const newDoc = await addDoc(callDocs, {})

  // Create a new RTCPeerConnection
  peerConnections[newDoc.id] = new RTCPeerConnection(servers);
  const peerConnection = peerConnections[newDoc.id];

  // Candidates collection reference
  const offerCandidates = collection(newDoc, 'offerCandidates');
  const answerCandidates = collection(newDoc, 'answerCandidates');

  // Establish connection and create a data channel
  const dataChannel = peerConnection.createDataChannel(fileName);
  dataChannel.binaryType = 'arraybuffer';
  dataChannel.onbufferedamountlow = null;

  // Listen for open data channel
  dataChannel.onopen = () => {
    console.log('dataChannel open');
  }

  // Array for the file
  const receivedBuffers: any = [];
  let receivedBytes = 0;

  // Listen for message from data channel
  dataChannel.onmessage = event => {
    // Download file
    const { data } = event;

    try {
      if (data !== END_OF_MESSAGE) {
        // Add to array
        receivedBuffers.push(data);
        receivedBytes += data.byteLength;

        console.log(`Received ${receivedBytes} bytes`);
      }
      else {
        // Create file from array
        const arrayBuffer = receivedBuffers.reduce((acc: any, curr: any) => {
          const temp = new Uint8Array(acc.byteLength + curr.byteLength);
          temp.set(new Uint8Array(acc), 0);
          temp.set(new Uint8Array(curr), acc.byteLength);
          return temp;
        }, new Uint8Array());

        const file = new File([arrayBuffer], fileName)

        downloadFile(file, fileName).then( () => {
          console.log('File downloaded')
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
        const candidate = new RTCIceCandidate(change.doc.data());    
        peerConnection.addIceCandidate(candidate);
      }
    })
  })

  return newDoc.id;
}

export async function createAnswer(offerID: string) {
  // Create a new RTCPeerConnection
  peerConnections[offerID] = new RTCPeerConnection(servers);
  const peerConnection = peerConnections[offerID];

  // Create a data channel
  peerConnection.ondatachannel = event => {
    const dataChannel = event.channel;
    dataChannel.onopen = () => {
      console.log('dataChannel open');
    }
  }

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

  return offerID;
}

export async function send(callID: string) {  
  peerConnections[callID].ondatachannel = event => {
    // Fetch the file input 
    const fileInput = document.querySelector('#toSend') as HTMLInputElement;
    const file = fileInput.files![0]

    const dataChannel = event.channel;

    dataChannel.binaryType = 'arraybuffer';
    dataChannel.onbufferedamountlow = null;

    // Listen for open data channel
    dataChannel.onopen = async () => {
      console.log('dataChannel open');

      const arrayBuffer = await file.arrayBuffer();

      // Send the file size

      for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK_SIZE) {
        if (dataChannel.bufferedAmount > MAX_CHUNK_SIZE) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Sending chunk ${i} of ${arrayBuffer.byteLength}`);
        progress(i, arrayBuffer.byteLength);
        
        const slice = arrayBuffer.slice(i, i + MAX_CHUNK_SIZE);
        dataChannel.send(slice);
      }

      dataChannel.send(END_OF_MESSAGE)
    }
  }
}

export async function closeConnection(callID: string) {
  // Close the connection when the file is sent
  peerConnections[callID].close();
  delete peerConnections[callID];
  console.log(`connection ${callID} closed`);
}

async function downloadFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');

  a.href = url;
  a.download = fileName;
  a.click();
  
  window.URL.revokeObjectURL(url);
  a.remove();
}

export function progress(current: number, total: number) {
  const bar = document.querySelector('.circle-container__progress') as HTMLDivElement;

  const progress = 100 - (current / total) * 100;

  bar.setAttribute('style', `stroke-dashoffset: ${progress}`);
  
}