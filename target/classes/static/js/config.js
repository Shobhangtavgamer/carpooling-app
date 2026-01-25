// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBo0docpHeWLl353mUHkj9UERkCGpwH7VE",
  authDomain: "carpool-connect-2ce1e.firebaseapp.com",
  projectId: "carpool-connect-2ce1e",
  storageBucket: "carpool-connect-2ce1e.firebasestorage.app",
  messagingSenderId: "700006571749",
  appId: "1:700006571749:web:b8b94d660237275e737e0c",
  measurementId: "G-RJ3QPNGQ69"
};

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyBo0docpHeWLl353mUHkj9UERkCGpwH7VE";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// App Configuration
const APP_CONFIG = {
  appName: "Carpool Connect",
  defaultProfileImage:
    "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff",
  maxSeatsPerRide: 8,
  minPricePerSeat: 0,
  maxPricePerSeat: 10000,
  searchRadius: 50, // km
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { firebaseConfig, GOOGLE_MAPS_API_KEY, APP_CONFIG };
}
