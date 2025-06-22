// Firebase Configuration
// Uses configuration from config.js for better security

// Initialize Firebase with config from config.js
firebase.initializeApp(CONFIG.FIREBASE_CONFIG);

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// Enable anonymous authentication for demo purposes
// Make this optional so the app works even if Firebase isn't configured
auth.signInAnonymously()
    .then(() => {
        console.log('Anonymous authentication successful');
    })
    .catch((error) => {
        console.warn('Firebase authentication failed (this is okay for demo):', error.message);
        // Continue without authentication - the app will still work
    }); 