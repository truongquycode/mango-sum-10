// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYKg88ibxqLz9dvUB2VgErs7aZdoVaCaA",
  authDomain: "mango-sum-10.firebaseapp.com",
  projectId: "mango-sum-10",
  storageBucket: "mango-sum-10.firebasestorage.app",
  messagingSenderId: "124396299004",
  appId: "1:124396299004:web:01a1cf71298fcedfe5ad79",
  measurementId: "G-653038FZ24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);