// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, addDoc, onSnapshot, updateDoc } from "firebase/firestore";

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

// Get calls collection
const ID = '7XmuMLGHpYViHWCgSu6x';

const call = doc(database, 'calls', ID); // get the call document
const answerCandidates = await getDocs(collection(call, 'answerCandidates')) // get the answer candidates collection
const offerCandidates = await getDocs(collection(call, 'offerCandidates')) // get the offer candidates collection


export async function createOffer(fileName: string) {
  // Establish connection and create a data channel
  const dataChannel = peerConnection.createDataChannel('dataChannel');

  // Create an offer and set it as local description
  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // Create offer SDP
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type
  }

  // Database reference
  const callDocs = collection(database, 'calls');

  // Add offer SDP to the database
  const newDoc = await addDoc(callDocs, { offer })
  console.log(newDoc.id);

  // Candidates collection reference
  const offerCandidates = collection(newDoc, 'offerCandidates');
  const answerCandidates = collection(newDoc, 'answerCandidates');
  
  // Add offer candidates to the database
  peerConnection.onicecandidate = event => {
    console.log(event.candidate);
    
    event.candidate && addDoc(offerCandidates, event.candidate?.toJSON());
  }

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
        peerConnection.addIceCandidate(candidate);
      }
    })
  })

}

export async function createAnswer(offerID: string) {
  // Create a data channel
  const dataChannel = peerConnection.createDataChannel('dataChannel');

  // Get references to incoming call
  const callDocs = doc(database, 'calls', offerID);
  const answerCandidates = collection(callDocs, 'answerCandidates');
  const offerCandidates = collection(callDocs, 'offerCandidates');

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

  // Listen for ICE candidates
  peerConnection.onicecandidate = event => {
    console.log(event.candidate);

    event.candidate && addDoc(answerCandidates, event.candidate?.toJSON());
  } // In the event of a ICE candidate, save it to the database

  onSnapshot(callDocs, doc => {
    // TODO: get offer candidates
  })
}

export function initFirebase() {
  createOffer('console.json');
  //createAnswer('C7L5LQj9tijpzl2LpIDS')
}