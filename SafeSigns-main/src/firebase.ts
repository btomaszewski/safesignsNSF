import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-PZLioMHwp9jdDnkINLsE2hfLPifWdwU",
  authDomain: "deaf-map-952b0.firebaseapp.com",
  projectId: "deaf-map-952b0",
  storageBucket: "deaf-map-952b0.appspot.com",
  messagingSenderId: "94898531531",
  appId: "1:94898531531:web:941140ba1b76e7f5edff4e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
