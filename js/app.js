// FoodFinder Application
class FoodFinderApp {
    constructor() {
        this.map = null;
        this.markers = [];
        this.places = [];
        this.filteredPlaces = [];
        this.autocomplete = null;
        this.infoWindow = null;
        this.config = CONFIG; // Use config from config.js
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing FoodFinder app...');
            
            // Load Google Maps API
            await this.loadGoogleMapsAPI();
            
            // Initialize map
            this.initializeMap();
            
            // Test the API with a simple location
            await this.testPlacesAPI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup autocomplete
            this.setupAutocomplete();
            
            console.log('FoodFinder app initialized successfully');
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to initialize app: ' + error.message);
        }
    }

    async loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            // Check if Google Maps is already loaded
            if (typeof google !== 'undefined' && google.maps) {
                console.log('Google Maps already loaded');
                resolve();
                return;
            }

            // Check if config is available
            if (!this.config || !this.config.GOOGLE_MAPS_API_KEY) {
                reject(new Error('Google Maps API key not found in configuration'));
                return;
            }

            console.log('Loading Google Maps API...');

            // Load Google Maps API dynamically
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initFoodFinderApp`;
            script.async = true;
            script.defer = true;
            
            // Create global callback function
            window.initFoodFinderApp = () => {
                console.log('Google Maps API loaded successfully');
                console.log('Google Maps object:', !!google);
                console.log('Google Maps Maps object:', !!google.maps);
                console.log('Google Maps Places object:', !!google.maps.places);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('Script load error:', error);
                reject(new Error('Failed to load Google Maps API script'));
            };
            
            // Set a timeout in case the API doesn't load
            const timeout = setTimeout(() => {
                reject(new Error('Google Maps API loading timeout (10s)'));
            }, 10000);
            
            script.onload = () => {
                clearTimeout(timeout);
                console.log('Script loaded, waiting for callback...');
            };
            
            document.head.appendChild(script);
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove error after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 8000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
            max-width: 80%;
            text-align: center;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        // Remove success after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    initializeMap() {
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
            this.showSuccess('Map loaded successfully!');
        } catch (error) {
            console.error('Map initialization error:', error);
            this.showError('Failed to initialize map: ' + error.message);
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

    setupEventListeners() {
        // Search button - now triggers search based on current map center
        document.getElementById('searchButton').addEventListener('click', () => {
            this.searchFromCurrentMapCenter();
        });

        // Search input enter key - now triggers search based on current map center
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchFromCurrentMapCenter();
            }
        });

        // Apply filters button - now triggers search based on current map center
        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.searchFromCurrentMapCenter();
        });

        // Apply filters only button - filters existing results without new search
        document.getElementById('applyFiltersOnlyButton').addEventListener('click', () => {
            this.applyFilters();
        });

        // Sort dropdown change
        document.getElementById('sortBy').addEventListener('change', () => {
            if (this.filteredPlaces.length > 0) {
                console.log('Sort option changed, re-sorting places...');
                this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
                this.displayPlaces();
            }
        });

        // Authentication button
        document.getElementById('authButton').addEventListener('click', () => {
            this.toggleAuth();
        });

        // Set default values from config
        document.getElementById('weightedRatingThreshold').value = this.config.APP_CONFIG.defaultWeightedRatingThreshold;
        document.getElementById('keywordInput').value = this.config.APP_CONFIG.defaultKeyword;
        document.getElementById('keywordThreshold').value = this.config.APP_CONFIG.defaultKeywordThreshold;
        
        console.log('Event listeners set up');
    }

    setupAutocomplete() {
        try {
            if (!google || !google.maps || !google.maps.places) {
                console.error('Google Maps Places API not available');
                this.showError('Places API not available. Please check your API key permissions.');
                return;
            }

            const input = document.getElementById('searchInput');
            this.autocomplete = new google.maps.places.Autocomplete(input, {
                types: ['establishment', 'geocode'],
                componentRestrictions: { country: [] }
            });

            this.autocomplete.addListener('place_changed', () => {
                const place = this.autocomplete.getPlace();
                console.log('Place selected for navigation:', place);
                if (place.geometry && place.geometry.location) {
                    // Extract actual coordinates
                    const location = place.geometry.location;
                    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
                    
                    const actualLocation = { lat, lng };
                    console.log('Navigating to location:', actualLocation);
                    
                    // Navigate to the selected location
                    this.map.setCenter(actualLocation);
                    this.map.setZoom(15);
                    
                    // Clear the input
                    input.value = '';
                    
                    // Show message that user can now search
                    this.showSuccess('Location set! Click "Search & Apply Filters" to find places here.');
                } else {
                    this.showError('Selected place has no location data');
                }
            });
            
            console.log('Autocomplete set up successfully');
        } catch (error) {
            console.error('Autocomplete setup error:', error);
            this.showError('Failed to set up search autocomplete: ' + error.message);
        }
    }

    async performSearch() {
        try {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) {
                this.showError('Please enter a search term');
                return;
            }

            console.log('Performing search for:', query);
            this.showLoading(true);

            const service = new google.maps.places.PlacesService(this.map);
            
            const searchRequest = {
                query: query,
                fields: ['name', 'geometry', 'formatted_address', 'rating', 'user_ratings_total', 'place_id']
            };

            console.log('Search request:', searchRequest);

            service.findPlaceFromQuery(searchRequest, (results, status) => {
                console.log('Search results:', results);
                console.log('Search status:', status);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    const selectedResult = results[0];
                    console.log('Selected result:', selectedResult);
                    
                    if (selectedResult.geometry && selectedResult.geometry.location) {
                        // Extract actual coordinates
                        const location = selectedResult.geometry.location;
                        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
                        
                        const actualLocation = { lat, lng };
                        console.log('Moving map to:', actualLocation);
                        
                        // Move map to the selected location
                        this.map.setCenter(actualLocation);
                        this.map.setZoom(15);
                        
                        // Store the search location to prevent map from moving elsewhere
                        this.lastSearchLocation = actualLocation;
                        
                        // Search for nearby places
                        this.searchNearby(actualLocation);
                    } else {
                        this.showError('Selected place has no location data');
                        this.showLoading(false);
                    }
                } else {
                    console.error('Search failed:', status);
                    this.showError(`Search failed: ${status}`);
                    this.showLoading(false);
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed: ' + error.message);
            this.showLoading(false);
        }
    }

    async searchNearby(location) {
        try {
            console.log('Searching nearby places at:', location);
            
            // Extract actual coordinates from the location object
            const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
            const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
            
            const actualLocation = { lat, lng };
            console.log('Actual coordinates:', actualLocation);
            
            // Get selected place types
            const selectedTypes = this.getSelectedPlaceTypes();
            console.log('Searching for place types:', selectedTypes);
            
            // Use the modern Places API approach
            const service = new google.maps.places.PlacesService(this.map);
            
            // Search for each place type separately and combine results
            const allResults = [];
            const allPlaces = [];
            
            for (const placeType of selectedTypes) {
                console.log(`Searching for ${placeType}...`);
                
                // Use multiple search strategies to get more results
                const searchStrategies = [
                    { radius: this.config.APP_CONFIG.defaultSearchRadius, name: 'standard' },
                    { radius: this.config.APP_CONFIG.defaultSearchRadius * 1.5, name: 'expanded' },
                    { radius: this.config.APP_CONFIG.defaultSearchRadius * 2, name: 'wide' }
                ];
                
                let typeResults = [];
                
                for (const strategy of searchStrategies) {
                    const request = {
                        location: actualLocation,
                        radius: strategy.radius,
                        type: placeType
                    };

                    console.log(`${placeType} search request (${strategy.name}):`, request);

                    try {
                        const strategyResults = await new Promise((resolve, reject) => {
                            service.nearbySearch(request, (results, status) => {
                                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                                    resolve(results);
                                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                    resolve([]);
                                } else {
                                    console.warn(`${placeType} search failed (${strategy.name}):`, status);
                                    resolve([]);
                                }
                            });
                        });
                        
                        // Add new results that weren't already found
                        const newResults = strategyResults.filter(newPlace => 
                            !typeResults.some(existingPlace => existingPlace.place_id === newPlace.place_id)
                        );
                        
                        typeResults.push(...newResults);
                        console.log(`Found ${strategyResults.length} total results, ${newResults.length} new results for ${placeType} (${strategy.name})`);
                        
                        // If we're getting close to the API limit, stop adding more strategies
                        if (typeResults.length >= 50) {
                            console.log(`Reached good number of results for ${placeType}, stopping additional searches`);
                            break;
                        }
                        
                    } catch (error) {
                        console.error(`Error searching for ${placeType} (${strategy.name}):`, error);
                    }
                }
                
                console.log(`Found ${typeResults.length} total ${placeType} places`);
                allResults.push(...typeResults);
                
            }
            
            // Remove duplicates based on place_id
            const uniqueResults = allResults.filter((place, index, self) => 
                index === self.findIndex(p => p.place_id === place.place_id)
            );
            
            console.log(`Total unique places found: ${uniqueResults.length}`);
            
            if (uniqueResults.length > 0) {
                console.log('Raw search results:', uniqueResults);
                
                // Get additional details for each place
                const enrichedPlaces = [];
                for (const place of uniqueResults) {
                    try {
                        console.log('Processing place:', place.name, place);
                        
                        // Get place details using the modern approach
                        const detailsRequest = {
                            placeId: place.place_id,
                            fields: ['name', 'geometry', 'formatted_address', 'rating', 'user_ratings_total', 'place_id', 'types']
                        };
                        
                        const detailsResult = await new Promise((resolve, reject) => {
                            service.getDetails(detailsRequest, (details, detailsStatus) => {
                                if (detailsStatus === google.maps.places.PlacesServiceStatus.OK) {
                                    console.log('Got details for:', place.name, details);
                                    resolve(details);
                                } else {
                                    console.warn('Failed to get details for place:', place.name, detailsStatus);
                                    resolve(place); // Use original place data
                                }
                            });
                        });
                        
                        enrichedPlaces.push(detailsResult || place);
                    } catch (error) {
                        console.warn('Error getting place details:', error);
                        enrichedPlaces.push(place);
                    }
                }
                
                console.log('Enriched places before processing:', enrichedPlaces);
                this.places = await this.enrichPlacesData(enrichedPlaces);
                console.log('Final places after enrichment:', this.places);
                this.filteredPlaces = [...this.places];
                
                // Apply sorting to the filtered places
                this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
                
                this.displayPlaces();
                this.updateResultsCount();
                this.ensureMapCenteredOnSearch(); // Keep map centered on search location
                this.showSuccess(`Found ${uniqueResults.length} places nearby!`);
            } else {
                console.error('No places found for any selected types');
                console.log('Trying fallback textSearch...');
                this.fallbackTextSearch(actualLocation, service);
                return; // Don't show loading false here, let fallback handle it
            }
            
            this.showLoading(false);
        } catch (error) {
            console.error('Search error:', error);
            this.showLoading(false);
            this.showError('Failed to search nearby places: ' + error.message);
        }
    }

    fallbackTextSearch(location, service) {
        // Get selected place types
        const selectedTypes = this.getSelectedPlaceTypes();
        console.log('Fallback search for place types:', selectedTypes);
        
        // Create search queries for each type
        const searchQueries = selectedTypes.map(type => `${type} near ${location.lat}, ${location.lng}`);
        
        console.log('Fallback text search queries:', searchQueries);

        // Search for each type and combine results
        const allResults = [];
        let completedSearches = 0;
        const totalSearches = searchQueries.length;

        searchQueries.forEach((query, index) => {
            service.textSearch({
                query: query,
                location: location,
                radius: this.config.APP_CONFIG.defaultSearchRadius
            }, async (results, status) => {
                console.log(`Fallback text search results for "${query}":`, results);
                console.log(`Fallback text search status for "${query}":`, status);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    console.log(`Found ${results.length} places with fallback search for "${query}"`);
                    
                    // Filter results to ensure they're actually near the search location
                    const filteredResults = results.filter(place => {
                        if (!place.geometry || !place.geometry.location) return false;
                        
                        const placeLat = typeof place.geometry.location.lat === 'function' 
                            ? place.geometry.location.lat() 
                            : place.geometry.location.lat;
                        const placeLng = typeof place.geometry.location.lng === 'function' 
                            ? place.geometry.location.lng() 
                            : place.geometry.location.lng;
                        
                        // Calculate distance (rough approximation)
                        const latDiff = Math.abs(placeLat - location.lat);
                        const lngDiff = Math.abs(placeLng - location.lng);
                        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
                        
                        // Only include places within reasonable distance (roughly 0.1 degrees ≈ 11km)
                        return distance < 0.1;
                    });
                    
                    console.log(`Filtered ${results.length} results down to ${filteredResults.length} nearby results for "${query}"`);
                    allResults.push(...filteredResults);
                } else {
                    console.warn(`Fallback search failed for "${query}":`, status);
                }
                
                completedSearches++;
                
                // When all searches are complete, process the combined results
                if (completedSearches === totalSearches) {
                    // Remove duplicates based on place_id
                    const uniqueResults = allResults.filter((place, index, self) => 
                        index === self.findIndex(p => p.place_id === place.place_id)
                    );
                    
                    console.log(`Total unique fallback results: ${uniqueResults.length}`);
                    
                    if (uniqueResults.length > 0) {
                        this.places = await this.enrichPlacesData(uniqueResults);
                        this.filteredPlaces = [...this.places];
                        
                        // Apply sorting to the filtered places
                        this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
                        
                        this.displayPlaces();
                        this.updateResultsCount();
                        this.ensureMapCenteredOnSearch(); // Keep map centered on search location
                        this.showSuccess(`Found ${uniqueResults.length} places nearby!`);
                    } else {
                        console.error('Both search methods failed');
                        this.showError(`No nearby places found. Please try a different location or place types.`);
                    }
                    this.showLoading(false);
                }
            });
        });
    }

    async enrichPlacesData(places) {
        const enrichedPlaces = [];

        for (const place of places) {
            try {
                let customData = {};

                // Try to get additional data from Firestore (optional)
                try {
                    const docRef = await db.collection('places').doc(place.place_id).get();
                    if (docRef.exists) {
                        customData = docRef.data();
                    } else {
                        // Create sample data for demonstration
                        customData = this.generateSampleData(place);
                        // Try to save to Firestore, but don't fail if it doesn't work
                        try {
                            await db.collection('places').doc(place.place_id).set(customData);
                        } catch (firebaseError) {
                            console.warn('Could not save to Firestore (using local data):', firebaseError.message);
                        }
                    }
                } catch (firebaseError) {
                    console.warn('Firebase not available, using local sample data:', firebaseError.message);
                    // Generate sample data locally if Firebase is not available
                    customData = this.generateSampleData(place);
                }

                enrichedPlaces.push({
                    ...place,
                    customData: customData,
                    weightedRating: (place.rating || 0) * (place.user_ratings_total || 0),
                    keywordCount: this.countKeywordOccurrences(customData.reviews || [], this.config.APP_CONFIG.defaultKeyword)
                });
            } catch (error) {
                console.error('Error enriching place data:', error);
                // Create a basic enriched place even if there's an error
                enrichedPlaces.push({
                    ...place,
                    customData: {},
                    weightedRating: (place.rating || 0) * (place.user_ratings_total || 0),
                    keywordCount: 0
                });
            }
        }

        return enrichedPlaces;
    }

    generateSampleData(place) {
        const sampleReviews = [
            "Great food and service! Highly recommend.",
            "The food was delicious but the service was slow.",
            "Amazing atmosphere and friendly staff.",
            "Food poisoning incident last week, be careful.",
            "Excellent quality and reasonable prices.",
            "The food poisoning scare was just a rumor.",
            "Best restaurant in the area!",
            "Good food but expensive.",
            "Avoid this place, had food poisoning symptoms.",
            "Wonderful experience, will come back!"
        ];

        const reviews = [];
        const numReviews = Math.floor(Math.random() * 10) + 5;
        
        for (let i = 0; i < numReviews; i++) {
            reviews.push(sampleReviews[Math.floor(Math.random() * sampleReviews.length)]);
        }

        return {
            reviews: reviews,
            customRating: (Math.random() * 2) + 3, // 3-5 rating
            lastUpdated: new Date().toISOString()
        };
    }

    countKeywordOccurrences(reviews, keyword) {
        const keywordLower = keyword.toLowerCase();
        let count = 0;
        
        reviews.forEach(review => {
            const reviewLower = review.toLowerCase();
            const matches = reviewLower.match(new RegExp(keywordLower, 'g'));
            if (matches) {
                count += matches.length;
            }
        });
        
        return count;
    }

    displayPlaces() {
        this.clearMarkers();
        
        console.log(`Displaying ${this.filteredPlaces.length} places on map`);
        console.log('Filtered places data:', this.filteredPlaces);
        
        this.filteredPlaces.forEach((place, index) => {
            // Make sure we have valid geometry data
            if (!place.geometry || !place.geometry.location) {
                console.warn('Place missing geometry:', place.name, place);
                return;
            }

            // Extract actual coordinates
            const location = place.geometry.location;
            const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
            const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
            
            const actualLocation = { lat, lng };
            console.log(`Creating marker for ${place.name} at:`, actualLocation);

            const marker = new google.maps.Marker({
                position: actualLocation,
                map: this.map,
                title: place.name || 'Unknown Place',
                icon: this.getMarkerIcon(place)
            });

            marker.addListener('click', () => {
                this.showPlaceDetails(place, marker);
            });

            this.markers.push(marker);
        });
        
        console.log(`Added ${this.markers.length} markers to map`);
        
        // Update the restaurants sidebar
        this.updateRestaurantsSidebar();
    }

    updateRestaurantsSidebar() {
        const restaurantsList = document.getElementById('restaurantsList');
        
        if (!this.filteredPlaces || this.filteredPlaces.length === 0) {
            restaurantsList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    No places found. Search for a location to see results.
                </div>
            `;
            return;
        }

        const restaurantsHTML = this.filteredPlaces.map((place, index) => {
            const rating = place.rating || 0;
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            const weightedRating = Math.round(place.weightedRating || 0);
            const keywordCount = place.keywordCount || 0;
            
            // Calculate distance if we have a search location
            let distanceInfo = '';
            if (this.lastSearchLocation) {
                const distance = this.calculateDistance(this.lastSearchLocation, place);
                if (distance !== Infinity) {
                    distanceInfo = `<div>Distance: ${distance.toFixed(1)} km</div>`;
                }
            }
            
            // Determine marker color based on filters
            let markerColor = 'blue';
            if (keywordCount > this.config.APP_CONFIG.highKeywordCountThreshold) {
                markerColor = 'red';
            } else if (weightedRating > this.config.APP_CONFIG.highWeightedRatingThreshold) {
                markerColor = 'green';
            }

            return `
                <div class="p-4 border-b restaurant-item cursor-pointer" onclick="foodFinderApp.showPlaceDetailsFromSidebar('${place.place_id}')">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-start justify-between">
                                <h3 class="font-medium text-gray-900 text-sm">${place.name || 'Unknown Place'}</h3>
                                <button onclick="event.stopPropagation(); foodFinderApp.openInGoogleMapsFromSidebar('${place.place_id}')" 
                                        class="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors" 
                                        title="Open in Google Maps">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${place.formatted_address || 'Address not available'}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-xs font-medium text-gray-900 mr-1">${rating}</span>
                                <span class="text-yellow-400 text-xs">${stars}</span>
                                <span class="text-xs text-gray-500 ml-1">(${place.user_ratings_total || 0})</span>
                            </div>
                        </div>
                        <div class="ml-2">
                            <div class="w-3 h-3 rounded-full bg-${markerColor}-500"></div>
                        </div>
                    </div>
                    <div class="mt-2 text-xs text-gray-500">
                        <div>Weighted: ${weightedRating}</div>
                        <div>Keywords: ${keywordCount}</div>
                        ${distanceInfo}
                    </div>
                </div>
            `;
        }).join('');

        restaurantsList.innerHTML = restaurantsHTML;
    }

    showPlaceDetailsFromSidebar(placeId) {
        const place = this.filteredPlaces.find(p => p.place_id === placeId);
        if (place) {
            const marker = this.markers.find(m => m.getTitle() === place.name);
            if (marker) {
                this.showPlaceDetails(place, marker);
            } else {
                // If marker not found, just show details without map interaction
                this.showPlaceDetails(place, null);
            }
        }
    }

    getMarkerIcon(place) {
        // Color markers based on weighted rating using config thresholds
        const weightedRating = place.weightedRating || 0;
        const keywordCount = place.keywordCount || 0;
        
        if (keywordCount > this.config.APP_CONFIG.highKeywordCountThreshold) {
            return {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="red"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">!</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24)
            };
        } else if (weightedRating > this.config.APP_CONFIG.highWeightedRatingThreshold) {
            return {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="green"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">★</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24)
            };
        } else {
            return {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="blue"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">📍</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24)
            };
        }
    }

    showPlaceDetails(place, marker) {
        const template = document.getElementById('infoWindowTemplate');
        const content = template.cloneNode(true);
        content.classList.remove('hidden');

        // Populate place details with fallbacks for missing data
        content.querySelector('#placeName').textContent = place.name || 'Unknown Place';
        content.querySelector('#placeAddress').textContent = place.formatted_address || 'Address not available';
        content.querySelector('#placeRating').textContent = place.rating || 'N/A';
        content.querySelector('#placeReviewCount').textContent = `(${place.user_ratings_total || 0} reviews)`;
        content.querySelector('#placeWeightedRating').textContent = Math.round(place.weightedRating || 0);
        content.querySelector('#placeKeywordCount').textContent = place.keywordCount || 0;

        // Show distance if available
        const distanceElement = content.querySelector('#placeDistance');
        const distanceValueElement = content.querySelector('#placeDistanceValue');
        if (this.lastSearchLocation) {
            const distance = this.calculateDistance(this.lastSearchLocation, place);
            if (distance !== Infinity) {
                distanceValueElement.textContent = `${distance.toFixed(1)} km`;
                distanceElement.classList.remove('hidden');
            } else {
                distanceElement.classList.add('hidden');
            }
        } else {
            distanceElement.classList.add('hidden');
        }

        // Generate stars
        const starsContainer = content.querySelector('#placeStars');
        const rating = place.rating || 0;
        starsContainer.innerHTML = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        // Set up Google Maps link
        const googleMapsButton = content.querySelector('#googleMapsLink');
        if (googleMapsButton) {
            googleMapsButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openInGoogleMaps(place);
            });
        }

        this.infoWindow.setContent(content);
        
        if (marker) {
            this.infoWindow.open(this.map, marker);
        } else {
            // If no marker provided, center the map on the place location
            if (place.geometry && place.geometry.location) {
                const location = place.geometry.location;
                const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
                const position = { lat, lng };
                
                this.map.setCenter(position);
                this.map.setZoom(16);
                this.infoWindow.setPosition(position);
                this.infoWindow.open(this.map);
            }
        }
    }

    openInGoogleMaps(place) {
        try {
            let mapsUrl;
            
            if (place.place_id) {
                // Use place_id for more accurate results
                mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
            } else if (place.geometry && place.geometry.location) {
                // Use coordinates if place_id is not available
                const location = place.geometry.location;
                const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            } else if (place.formatted_address) {
                // Use address as fallback
                const encodedAddress = encodeURIComponent(place.formatted_address);
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            } else {
                // Use place name as last resort
                const encodedName = encodeURIComponent(place.name || 'Unknown Place');
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
            }
            
            console.log('Opening Google Maps URL:', mapsUrl);
            
            // Open in new tab
            window.open(mapsUrl, '_blank');
            
            // Show success message
            this.showSuccess('Opening Google Maps...');
            
        } catch (error) {
            console.error('Error opening Google Maps:', error);
            this.showError('Failed to open Google Maps');
        }
    }

    openInGoogleMapsFromSidebar(placeId) {
        try {
            // Find the place by place_id
            const place = this.filteredPlaces.find(p => p.place_id === placeId);
            if (place) {
                this.openInGoogleMaps(place);
            } else {
                console.error('Place not found for place_id:', placeId);
                this.showError('Place not found');
            }
        } catch (error) {
            console.error('Error opening Google Maps from sidebar:', error);
            this.showError('Failed to open Google Maps');
        }
    }

    applyFilters() {
        if (!this.places || this.places.length === 0) {
            this.showError('No places to filter. Please search for places first.');
            return;
        }

        const weightedRatingEnabled = document.getElementById('weightedRatingEnabled').checked;
        const keywordEnabled = document.getElementById('keywordEnabled').checked;
        
        const weightedRatingThreshold = parseFloat(document.getElementById('weightedRatingThreshold').value) || 0;
        const keyword = document.getElementById('keywordInput').value.toLowerCase();
        const keywordMinThreshold = parseInt(document.getElementById('keywordMinThreshold').value) || 0;
        const keywordThreshold = parseInt(document.getElementById('keywordThreshold').value) || 0;

        console.log('Applying filters:', {
            weightedRatingEnabled,
            keywordEnabled,
            weightedRatingThreshold,
            keyword,
            keywordMinThreshold,
            keywordThreshold
        });

        this.filteredPlaces = this.places.filter(place => {
            let passesWeightedRating = true;
            let passesKeyword = true;

            // Apply weighted rating filter
            if (weightedRatingEnabled) {
                const weightedRating = place.weightedRating || 0;
                passesWeightedRating = weightedRating >= weightedRatingThreshold;
            }

            // Apply keyword filter
            if (keywordEnabled && keyword) {
                const keywordCount = this.countKeywordOccurrences(
                    place.customData.reviews || [], 
                    keyword
                );
                passesKeyword = keywordCount >= keywordMinThreshold && keywordCount <= keywordThreshold;
            }

            return passesWeightedRating && passesKeyword;
        });

        console.log(`Filtered ${this.places.length} places down to ${this.filteredPlaces.length}`);
        
        // Apply sorting to filtered places
        this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
        
        this.displayPlaces();
        this.updateResultsCount();
    }

    updateResultsCount() {
        document.getElementById('totalResults').textContent = this.places.length;
        document.getElementById('filteredResults').textContent = this.filteredPlaces.length;
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    async toggleAuth() {
        const authButton = document.getElementById('authButton');
        
        if (auth.currentUser) {
            await auth.signOut();
            authButton.textContent = 'Sign In';
        } else {
            await auth.signInAnonymously();
            authButton.textContent = 'Signed In';
        }
    }

    async populateSampleData() {
        // This method can be used to populate Firestore with sample data
        // For now, it's empty as we generate data on-demand
        console.log('Sample data population ready');
    }

    async testPlacesAPI() {
        try {
            console.log('Testing Places API...');
            
            // Test with a simple, known location (Times Square, NYC)
            const testLocation = { lat: 40.7580, lng: -73.9855 };
            const service = new google.maps.places.PlacesService(this.map);
            
            // Get selected place types for testing
            const selectedTypes = this.getSelectedPlaceTypes();
            console.log('Testing with place types:', selectedTypes);
            
            // Test with nearbySearch which respects location bounds
            return new Promise((resolve) => {
                // Test with the first selected type
                const testType = selectedTypes[0] || 'restaurant';
                
                service.nearbySearch({
                    location: testLocation,
                    radius: 1000,
                    type: testType
                }, (results, status) => {
                    console.log('API Test Results:', {
                        status: status,
                        statusText: this.getStatusText(status),
                        resultsCount: results ? results.length : 0,
                        hasResults: results && results.length > 0,
                        testedType: testType
                    });
                    
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        console.log('✅ Places API is working correctly');
                    } else {
                        console.error('❌ Places API test failed:', this.getStatusText(status));
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error('API test error:', error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            [google.maps.places.PlacesServiceStatus.OK]: 'OK',
            [google.maps.places.PlacesServiceStatus.ZERO_RESULTS]: 'ZERO_RESULTS',
            [google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT]: 'OVER_QUERY_LIMIT',
            [google.maps.places.PlacesServiceStatus.REQUEST_DENIED]: 'REQUEST_DENIED',
            [google.maps.places.PlacesServiceStatus.INVALID_REQUEST]: 'INVALID_REQUEST',
            [google.maps.places.PlacesServiceStatus.NOT_FOUND]: 'NOT_FOUND'
        };
        return statusMap[status] || `UNKNOWN_STATUS_${status}`;
    }

    // Test method for debugging - can be called from console
    testSearch() {
        console.log('Testing search with Tel Aviv location...');
        const testLocation = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv
        this.map.setCenter(testLocation);
        this.map.setZoom(15);
        this.searchNearby(testLocation);
    }

    // Debug method to check current map state
    debugMapState() {
        const center = this.map.getCenter();
        console.log('Current map state:', {
            center: { lat: center.lat(), lng: center.lng() },
            zoom: this.map.getZoom(),
            lastSearchLocation: this.lastSearchLocation,
            placesCount: this.places.length,
            filteredPlacesCount: this.filteredPlaces.length
        });
    }

    // Method to get selected place types from filter checkboxes
    getSelectedPlaceTypes() {
        const placeTypes = [];
        const typeCheckboxes = [
            { id: 'typeRestaurant', type: 'restaurant' },
            { id: 'typeCafe', type: 'cafe' },
            { id: 'typeBar', type: 'bar' },
            { id: 'typeBakery', type: 'bakery' },
            { id: 'typeFood', type: 'food' },
            { id: 'typeHotel', type: 'lodging' },
            { id: 'typeLodging', type: 'lodging' }
        ];

        typeCheckboxes.forEach(({ id, type }) => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked) {
                placeTypes.push(type);
            }
        });

        // Remove duplicates (lodging appears twice)
        const uniqueTypes = [...new Set(placeTypes)];
        
        console.log('Selected place types:', uniqueTypes);
        return uniqueTypes.length > 0 ? uniqueTypes : ['restaurant']; // Default to restaurant if none selected
    }

    // Method to get current sort selection
    getCurrentSortOption() {
        const sortSelect = document.getElementById('sortBy');
        return sortSelect ? sortSelect.value : 'name';
    }

    // Method to sort places based on selected criteria
    sortPlaces(places) {
        const sortOption = this.getCurrentSortOption();
        console.log('Sorting places by:', sortOption);
        
        const sortedPlaces = [...places];
        
        switch (sortOption) {
            case 'name':
                sortedPlaces.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                sortedPlaces.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'rating':
                sortedPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'rating-asc':
                sortedPlaces.sort((a, b) => (a.rating || 0) - (b.rating || 0));
                break;
            case 'weighted-rating':
                sortedPlaces.sort((a, b) => (b.weightedRating || 0) - (a.weightedRating || 0));
                break;
            case 'weighted-rating-asc':
                sortedPlaces.sort((a, b) => (a.weightedRating || 0) - (b.weightedRating || 0));
                break;
            case 'review-count':
                sortedPlaces.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
                break;
            case 'review-count-asc':
                sortedPlaces.sort((a, b) => (a.user_ratings_total || 0) - (b.user_ratings_total || 0));
                break;
            case 'keyword-count':
                sortedPlaces.sort((a, b) => (b.keywordCount || 0) - (a.keywordCount || 0));
                break;
            case 'keyword-count-asc':
                sortedPlaces.sort((a, b) => (a.keywordCount || 0) - (b.keywordCount || 0));
                break;
            case 'distance':
                if (this.lastSearchLocation) {
                    sortedPlaces.sort((a, b) => {
                        const distanceA = this.calculateDistance(this.lastSearchLocation, a);
                        const distanceB = this.calculateDistance(this.lastSearchLocation, b);
                        return distanceA - distanceB;
                    });
                }
                break;
            default:
                // Default to name sorting
                sortedPlaces.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        
        console.log(`Sorted ${sortedPlaces.length} places by ${sortOption}`);
        return sortedPlaces;
    }

    // Method to calculate distance between two points (Haversine formula)
    calculateDistance(point1, place) {
        if (!place.geometry || !place.geometry.location) return Infinity;
        
        const lat1 = point1.lat;
        const lng1 = point1.lng;
        const location = place.geometry.location;
        const lat2 = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng2 = typeof location.lng === 'function' ? location.lng() : location.lng;
        
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    // Method to search from current map center
    async searchFromCurrentMapCenter() {
        try {
            if (!this.map) {
                this.showError('Map not initialized');
                return;
            }

            const center = this.map.getCenter();
            const currentLocation = {
                lat: center.lat(),
                lng: center.lng()
            };

            console.log('Searching from current map center:', currentLocation);
            this.showLoading(true);

            // Store the search location
            this.lastSearchLocation = currentLocation;

            // Search for nearby places
            await this.searchNearby(currentLocation);

        } catch (error) {
            console.error('Error searching from current map center:', error);
            this.showError('Failed to search from current location: ' + error.message);
            this.showLoading(false);
        }
    }

}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing FoodFinder...');
    // Create global instance
    window.foodFinderApp = new FoodFinderApp();
    
    // Make test method globally accessible
    window.testSearch = () => {
        if (window.foodFinderApp) {
            window.foodFinderApp.testSearch();
        } else {
            console.error('FoodFinder app not initialized yet');
        }
    };
    
    // Make debug method globally accessible
    window.debugMap = () => {
        if (window.foodFinderApp) {
            window.foodFinderApp.debugMapState();
        } else {
            console.error('FoodFinder app not initialized yet');
        }
    };
    
    // Make Google Maps methods globally accessible
    window.openInGoogleMapsFromSidebar = (placeId) => {
        if (window.foodFinderApp) {
            window.foodFinderApp.openInGoogleMapsFromSidebar(placeId);
        } else {
            console.error('FoodFinder app not initialized yet');
        }
    };
}); 