// Configuration Template for FoodFinder
// Copy this file to js/config.js and update with your actual API keys
// This file is gitignored to keep your API keys secure

const CONFIG = {
    // Google Maps API Configuration
    // Get from: https://console.cloud.google.com/ > APIs & Services > Credentials
    GOOGLE_MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY_HERE",
    
    // Firebase Configuration
    // Get from: https://console.firebase.google.com/ > Project Settings > General > Your apps
    FIREBASE_CONFIG: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID",
        measurementId: "YOUR_MEASUREMENT_ID" // Optional
    },
    
    // Application Settings
    APP_CONFIG: {
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
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 