// Map Manager - Handles Google Maps initialization and navigation
class MapManager {
    constructor(config) {
        this.map = null;
        this.infoWindow = null;
        this.lastSearchLocation = null;
        this.config = config;
    }

    async initializeMap() {
        try {
            // Initialize Google Map using config values
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: this.config.APP_CONFIG.defaultMapCenter,
                zoom: this.config.APP_CONFIG.defaultZoom,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            // Initialize info window
            this.infoWindow = new google.maps.InfoWindow();
            
            // Add map movement listener for debugging
            this.map.addListener('center_changed', () => {
                const center = this.map.getCenter();
                console.log('Map center changed to:', {
                    lat: center.lat(),
                    lng: center.lng()
                });
            });
            
            console.log('Map initialized successfully');
            return true;
        } catch (error) {
            console.error('Map initialization error:', error);
            throw new Error('Failed to initialize map: ' + error.message);
        }
    }

    // Method to ensure map stays centered on search location
    ensureMapCenteredOnSearch() {
        if (this.lastSearchLocation) {
            console.log('Ensuring map is centered on search location:', this.lastSearchLocation);
            this.map.setCenter(this.lastSearchLocation);
            this.map.setZoom(15);
        }
    }

    // Navigate to a specific location
    navigateToLocation(location) {
        try {
            // Extract actual coordinates from the location object
            const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
            const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
            
            const actualLocation = { lat, lng };
            console.log('Navigating to location:', actualLocation);
            
            // Navigate to the selected location
            this.map.setCenter(actualLocation);
            this.map.setZoom(15);
            
            // Store the search location to prevent map from moving elsewhere
            this.lastSearchLocation = actualLocation;
            
            return actualLocation;
        } catch (error) {
            console.error('Navigation error:', error);
            throw new Error('Failed to navigate to location: ' + error.message);
        }
    }

    // Get current map center
    getCurrentCenter() {
        const center = this.map.getCenter();
        return {
            lat: center.lat(),
            lng: center.lng()
        };
    }

    // Get current map bounds and calculate appropriate search radius
    getMapBoundsAndRadius() {
        if (!this.map) {
            return {
                bounds: null,
                radius: this.config.APP_CONFIG.defaultSearchRadius
            };
        }

        const bounds = this.map.getBounds();
        if (!bounds) {
            return {
                bounds: null,
                radius: this.config.APP_CONFIG.defaultSearchRadius
            };
        }

        // Calculate the dimensions of the current map view
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const latDiff = Math.abs(ne.lat() - sw.lat());
        const lngDiff = Math.abs(ne.lng() - sw.lng());
        
        // Convert to approximate meters (rough conversion: 1 degree ≈ 111,000 meters)
        const latDistance = latDiff * 111000;
        const lngDistance = lngDiff * 111000 * Math.cos(ne.lat() * Math.PI / 180); // Adjust for latitude
        
        // Use the smaller dimension as the base radius to ensure we stay within visible bounds
        // This prevents searching areas that are outside the current map view
        const baseRadius = Math.min(latDistance, lngDistance) / 2;
        
        // Apply additional safety factor to ensure we stay well within bounds
        const safetyFactor = 0.7; // Use 70% of the smaller dimension
        const radius = Math.max(baseRadius * safetyFactor, 500); // Minimum 500m
        
        // Ensure radius is within reasonable bounds
        const maxRadius = 25000; // 25km max (reduced from 50km)
        const minRadius = 500;   // 500m min (reduced from 1km)
        const finalRadius = Math.min(Math.max(radius, minRadius), maxRadius);
        
        console.log('Map bounds analysis:', {
            bounds: {
                ne: { lat: ne.lat(), lng: ne.lng() },
                sw: { lat: sw.lat(), lng: sw.lng() }
            },
            dimensions: {
                latDistance: Math.round(latDistance),
                lngDistance: Math.round(lngDistance)
            },
            baseRadius: Math.round(baseRadius),
            safetyFactor: safetyFactor,
            calculatedRadius: Math.round(finalRadius)
        });
        
        return {
            bounds: bounds,
            radius: Math.round(finalRadius)
        };
    }

    // Get map instance
    getMap() {
        return this.map;
    }

    // Get info window instance
    getInfoWindow() {
        return this.infoWindow;
    }

    // Debug method to check current map state
    debugMapState() {
        const center = this.map.getCenter();
        console.log('Current map state:', {
            center: { lat: center.lat(), lng: center.lng() },
            zoom: this.map.getZoom(),
            lastSearchLocation: this.lastSearchLocation
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
} 