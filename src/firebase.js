import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBnYYK5AlMhxmkVXTvGsB-_P80wEutCtbw",
  authDomain: "high5-dash.firebaseapp.com",
  projectId: "high5-dash",
  storageBucket: "high5-dash.firebasestorage.app",
  messagingSenderId: "705701100221",
  appId: "1:705701100221:web:60fbd17c994ed00496d5d4",
  measurementId: "G-QG8YX62PLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);