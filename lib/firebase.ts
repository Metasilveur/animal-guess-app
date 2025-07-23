import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtqnvBeBGaBXqbiTBGyDvIaa-WbG2iIsA",
  authDomain: "dev-moula.firebaseapp.com",
  projectId: "dev-moula",
  storageBucket: "dev-moula.firebasestorage.app",
  messagingSenderId: "529573644325",
  appId: "1:529573644325:web:310c004ed0ec87b211d7cc",
  measurementId: "G-B1ZKBKNCWC"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// Initialize Analytics (only on client side)
let analytics
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { db, analytics } 