// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCYKg88ibxqLz9dvUB2VgErs7aZdoVaCaA",
  authDomain: "mango-sum-10.firebaseapp.com",
  databaseURL: "https://mango-sum-10-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "mango-sum-10",
  storageBucket: "mango-sum-10.firebasestorage.app",
  messagingSenderId: "124396299004",
  appId: "1:124396299004:web:01a1cf71298fcedfe5ad79",
  measurementId: "G-653038FZ24"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);