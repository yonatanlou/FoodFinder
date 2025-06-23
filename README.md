# PlacesFinder 🌍

A modern, beautiful web application for discovering and filtering places using Google Maps API. Built with vanilla JavaScript, Tailwind CSS, and a modular architecture.

## ✨ Features

- **Interactive Google Maps Integration** - Real-time map navigation and place discovery
- **Advanced Filtering System** - Filter by rating, price level, keywords, and place types
- **Smart Search** - Map-based radius calculation for optimal results
- **Beautiful Modern UI** - Glass morphism design with smooth animations
- **Real-time Data** - Live place information with icons, ratings, and reviews
- **Responsive Design** - Works perfectly on desktop and mobile devices

![demo](assets/demo_app.gif)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Google Maps API key
- Firebase project (optional, for enhanced features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PlacesFinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your API keys**
   - Copy `js/config.template.js` to `js/config.js`
   - Add your Google Maps API key
   - Configure Firebase settings (optional)

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:8000`

## 🛠️ Configuration

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API key)
5. Add the API key to `js/config.js`

### Firebase Setup (Optional)
1. Create a Firebase project
2. Enable Firestore and Authentication
3. Add Firebase config to `js/firebase-config.js`

## 📁 Project Structure

```
PlacesFinder/
├── index.html              # Main HTML file
├── server.js               # Express server
├── package.json            # Dependencies and scripts
├── js/
│   ├── app.js              # Main application controller
│   ├── config.js           # Configuration settings
│   ├── map-manager.js      # Google Maps integration
│   ├── search-service.js   # Places API search logic
│   ├── filter-manager.js   # Filtering and sorting
│   ├── ui-manager.js       # User interface management
│   ├── data-enricher.js    # Data enrichment and processing
│   └── firebase-config.js  # Firebase configuration
└── README.md               # This file
```

## 🎯 Core Features

### Smart Filtering
- **Weighted Rating Filter** - Filter by (rating × review count)
- **Keyword Search** - Find places based on review content
- **Price Level Filter** - Filter by cost (💰 to 💰💰💰💰)
- **Place Type Selection** - Choose from restaurants, cafes, bars, etc.

### Advanced Search
- **Map-Based Radius** - Automatically calculates search radius based on map view
- **Multiple Search Strategies** - Uses different radius sizes for comprehensive results
- **Fallback Search** - Text-based search when nearby search fails

### Beautiful Interface
- **Glass Morphism Design** - Modern backdrop blur effects
- **Gradient Accents** - Beautiful color schemes
- **Smooth Animations** - Professional transitions and micro-interactions
- **Responsive Layout** - Works on all device sizes

## 🔧 API Endpoints

- `GET /` - Main application
- `GET /health` - Health check endpoint
- `GET /js/*` - Static JavaScript files

## 🎨 Customization

### Styling
The app uses Tailwind CSS with custom configurations. You can modify:
- Color schemes in `index.html` (Tailwind config)
- Custom CSS classes in the `<style>` section
- Component styling in individual modules

### Functionality
- Add new place types in `search-service.js`
- Modify filter logic in `filter-manager.js`
- Customize UI components in `ui-manager.js`

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables
- `PORT` - Server port (default: 8000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development tasks
- Make a pro version which uses the pro google places API, where we can fetch more then 5 reviews per place. Then we can use LLM for asking far more interesting questions about the place (is it a hidden gem?, is it a new place?, etc)
- Make it avaialbe for phone use (maybe an app)
- Database implementation - saving data for reducing API calls and get more reviews per place.
- Think of other features that are not restaurant related.


---

**PlacesFinder** - Discover amazing places around the world! 🌍✨ 