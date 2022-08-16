// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, addDoc } from "firebase/firestore";

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

// Get calls collection
const ID = '71JwxH6SMwN6p9ecGDSQ';

const callDocs = collection(database, 'calls'); // get the collection of calls
const call = doc(database, 'calls', ID); // get the call document
const answerCandidates = await getDocs(collection(call, 'answerCandidates')) // get the answer candidates collection
const offerCandidates = await getDocs(collection(call, 'offerCandidates')) // get the offer candidates collection

// Read data
const callData = (await getDoc(call)).data()

// Write data
addDoc(callDocs, {
  ...callData
})

export function initFirebase() {
  console.log(callData);
}