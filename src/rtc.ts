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
const peerConnection = new RTCPeerConnection(servers);

////////////////////////////////////////////////////////////////////////////////

export async function createOffer(fileName: string) {
  // Database reference
  const callDocs = collection(database, 'calls');

  // Add offer SDP to the database
  const newDoc = await addDoc(callDocs, {})

  // Candidates collection reference
  const offerCandidates = collection(newDoc, 'offerCandidates');
  const answerCandidates = collection(newDoc, 'answerCandidates');

  // Establish connection and create a data channel
  const dataChannel = peerConnection.createDataChannel(fileName);

  dataChannel.onopen = () => {
    console.log('dataChannel open');
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
  console.log(offer);

  // Add offer SDP to the database
  await updateDoc(newDoc, { offer });

  // Listen for remote answer SDP
  onSnapshot(newDoc, snapshot => {
    const data = snapshot.data();
    
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      console.log(data?.answer)
    
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
        console.log(candidate);
        
        peerConnection.addIceCandidate(candidate);
      }
    })
  })

  return newDoc.id;
}

export async function createAnswer(offerID: string) {
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
  console.log(offerDescription);
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
        console.log(candidate);

        peerConnection.addIceCandidate(candidate);
      }
    })
  })

}

export function initFirebase() {
  //createOffer('console.json');
  //createAnswer('C7L5LQj9tijpzl2LpIDS')
}