# FoodFinder - Custom Map Filter Application

**This is my first project using cursur AI.**

A web application that integrates with Google Maps to provide advanced, custom filtering capabilities for location searches. Built with vanilla JavaScript, Google Maps API, and Firebase for data storage.

## Features

### Core Functionality
- **Interactive Google Map**: Full-featured map with pan, zoom, and search capabilities
- **Global Search**: Search for any place worldwide using Google Places Autocomplete
- **Real-time Results**: Dynamic marker display with instant search results
- **Custom Filters**: Advanced filtering beyond standard map applications

### Custom Filtering System
1. **Weighted Average Rating Filter**
   - Formula: `(Average Rating) × (Number of Reviewers)`
   - Find highly-rated and well-reviewed places
   - Configurable minimum threshold

2. **Keyword Incidence Filter**
   - Search for specific keywords in reviews (e.g., "food poisoning")
   - Filter places based on keyword frequency
   - Configurable keyword and maximum count threshold

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with Tailwind CSS for a clean, professional look
- **Interactive Markers**: Color-coded markers based on filter criteria
- **Detailed Info Windows**: Click markers to view comprehensive place information

## Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Maps**: Google Maps JavaScript API
- **Places**: Google Places API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication (Anonymous)
- **Styling**: Tailwind CSS
- **Future**: Gemini API integration for advanced review analysis

## Setup Instructions

### Prerequisites
- Google Cloud Platform account
- Firebase project
- Modern web browser

### 1. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database
4. Enable Authentication (Anonymous sign-in)
5. Get your Firebase configuration

### 3. Application Configuration

1. **Create Configuration File**:
   ```bash
   # Copy the template to create your config file
   cp js/config.template.js js/config.js
   ```

2. **Update Configuration**:
   - Open `js/config.js`
   - Replace the placeholder values with your actual API keys:
   ```javascript
   const CONFIG = {
       GOOGLE_MAPS_API_KEY: "your-google-maps-api-key",
       FIREBASE_CONFIG: {
           apiKey: "your-firebase-api-key",
           authDomain: "your-project-id.firebaseapp.com",
           projectId: "your-project-id",
           storageBucket: "your-project-id.appspot.com",
           messagingSenderId: "your-sender-id",
           appId: "your-app-id"
       },
       // ... other settings
   };
   ```

### 4. Firestore Security Rules

Set up Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /places/{placeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Running the Application

1. **Quick Start** (Recommended):
   ```bash
   ./quick-start.sh
   ```

2. **Manual Setup**:
   ```bash
   # Start server
   node server.js
   ```

3. **Production Deployment**:
   - Deploy to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)
   - Ensure your domain is added to Google Maps API key restrictions

## Security Features

### 🔒 Secure Configuration Management
- **Separate Config Files**: API keys are stored in `js/config.js` (gitignored)
- **Template System**: Use `js/config.template.js` as a starting point
- **No Hardcoded Keys**: API keys are never committed to version control
- **Environment Ready**: Easy to switch between development and production configs

### 🛡️ API Key Protection
- Configuration files are excluded from Git
- Template files provided for easy setup
- Clear documentation on where to get API keys
- Security best practices included

## Usage Guide

### Basic Search
1. Enter a location or place name in the search bar
2. Use autocomplete suggestions or press Enter
3. View results as markers on the map
4. Click markers to see detailed information

### Applying Custom Filters

#### Weighted Average Rating Filter
1. Check "Enable this filter" for Weighted Average Rating
2. Set your minimum threshold (default: 100)
3. Click "Apply Filters"
4. Results will show only places meeting the criteria

#### Keyword Incidence Filter
1. Check "Enable this filter" for Keyword Incidence
2. Enter your keyword (default: "food poisoning")
3. Set maximum count threshold (default: 5)
4. Click "Apply Filters"
5. Results will exclude places with too many keyword occurrences

### Marker Color Coding
- **Green with Star**: High weighted rating (>200)
- **Red with Exclamation**: High keyword count (>5)
- **Blue with Pin**: Standard places

## Data Structure

### Firestore Collections

#### `places/{placeId}`
```javascript
{
  reviews: [
    "Great food and service!",
    "Amazing atmosphere and friendly staff.",
    // ... more reviews
  ],
  customRating: 4.2,
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### Place Object Structure
```javascript
{
  name: "Restaurant Name",
  geometry: { location: { lat, lng } },
  formatted_address: "123 Main St, City, State",
  rating: 4.5,
  user_ratings_total: 150,
  place_id: "unique_google_place_id",
  customData: { /* Firestore data */ },
  weightedRating: 675, // rating × user_ratings_total
  keywordCount: 2 // occurrences of search keyword
}
```

## Configuration Options

### Application Settings
All settings can be customized in `js/config.js`:

```javascript
APP_CONFIG: {
    defaultSearchRadius: 5000,        // Search radius in meters
    defaultMapCenter: { lat, lng },   // Default map center
    defaultZoom: 12,                  // Default zoom level
    defaultWeightedRatingThreshold: 100,  // Default filter threshold
    defaultKeyword: "food poisoning",     // Default keyword
    defaultKeywordThreshold: 5,           // Default keyword threshold
    highWeightedRatingThreshold: 200,     // Green marker threshold
    highKeywordCountThreshold: 5          // Red marker threshold
}
```

## Future Enhancements

### Planned Features
- **User Accounts**: Email/password authentication
- **Saved Places**: Bookmark favorite locations
- **Custom Filter Presets**: Save and reuse filter combinations
- **Advanced Review Analysis**: Gemini API integration for sentiment analysis
- **Community Features**: User-contributed reviews and ratings
- **Export Functionality**: Download filtered results

### LLM Integration (Gemini API)
- Sentiment analysis of reviews
- Topic extraction and categorization
- Automatic issue identification (noise, service quality, etc.)
- Smart filter suggestions based on review content

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check Google Maps API key in `js/config.js`
   - Verify API key restrictions
   - Check browser console for errors

2. **Search Not Working**
   - Ensure Places API is enabled
   - Check API key permissions
   - Verify billing is set up for Google Cloud project

3. **Firebase Connection Issues**
   - Verify Firebase configuration in `js/config.js`
   - Check Firestore security rules
   - Ensure authentication is properly configured

4. **Configuration Issues**
   - Ensure `js/config.js` exists (copy from template if needed)
   - Check that all API keys are properly set
   - Verify file permissions

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review Google Maps API documentation
- Consult Firebase documentation
- Open an issue on GitHub

## Acknowledgments

- Google Maps Platform for mapping services
- Firebase for backend services
- Tailwind CSS for styling framework
- Community contributors and testers 