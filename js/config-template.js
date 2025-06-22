// Configuration Template for FoodFinder
// Copy this file to js/firebase-config.js and update with your actual values

// Google Maps API Configuration
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Application Settings
const APP_CONFIG = {
    // Default search radius in meters
    defaultSearchRadius: 5000,
    
    // Default map center (New York City)
    defaultMapCenter: {
        lat: 40.7128,
        lng: -74.0060
    },
    
    // Default map zoom level
    defaultZoom: 12,
    
    // Filter defaults
    defaultWeightedRatingThreshold: 100,
    defaultKeyword: "food poisoning",
    defaultKeywordThreshold: 5,
    
    // Marker thresholds
    highWeightedRatingThreshold: 200,
    highKeywordCountThreshold: 5
};

// Export configuration (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GOOGLE_MAPS_API_KEY,
        firebaseConfig,
        APP_CONFIG
    };
} 