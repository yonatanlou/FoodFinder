const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (your HTML, CSS, JS)
app.use(express.static('public'));

// API endpoint to provide Maps configuration
app.get('/api/maps-config', (req, res) => {
    // Only send the API key, never log it
    res.json({
        apiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure your .env file contains GOOGLE_MAPS_API_KEY');
});