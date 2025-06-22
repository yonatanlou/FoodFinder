// Search Service - Handles Google Places API searches
class SearchService {
    constructor(mapManager, config) {
        this.mapManager = mapManager;
        this.config = config;
        this.autocomplete = null;
    }

    setupAutocomplete() {
        try {
            if (!google || !google.maps || !google.maps.places) {
                console.error('Google Maps Places API not available');
                throw new Error('Places API not available. Please check your API key permissions.');
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
                    // Navigate to the selected location
                    this.mapManager.navigateToLocation(place.geometry.location);
                    
                    // Clear the input
                    input.value = '';
                    
                    // Show message that user can now search
                    this.showSuccess('Location set! Click "Apply Filters" to search for places here.');
                } else {
                    this.showError('Selected place has no location data');
                }
            });
            
            console.log('Autocomplete set up successfully');
        } catch (error) {
            console.error('Autocomplete setup error:', error);
            throw error;
        }
    }

    async performNavigation(query) {
        try {
            if (!query || !query.trim()) {
                throw new Error('Please enter a search term');
            }

            console.log('Navigating to:', query);

            const service = new google.maps.places.PlacesService(this.mapManager.getMap());
            
            const searchRequest = {
                query: query,
                fields: ['name', 'geometry', 'formatted_address', 'rating', 'user_ratings_total', 'place_id']
            };

            console.log('Navigation request:', searchRequest);

            return new Promise((resolve, reject) => {
                service.findPlaceFromQuery(searchRequest, (results, status) => {
                    console.log('Navigation results:', results);
                    console.log('Navigation status:', status);
                    
                    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                        const selectedResult = results[0];
                        console.log('Selected result:', selectedResult);
                        
                        if (selectedResult.geometry && selectedResult.geometry.location) {
                            // Navigate to the selected location
                            const actualLocation = this.mapManager.navigateToLocation(selectedResult.geometry.location);
                            
                            // Clear the input
                            document.getElementById('searchInput').value = '';
                            
                            resolve({
                                success: true,
                                location: actualLocation,
                                placeName: selectedResult.name || query
                            });
                        } else {
                            reject(new Error('Selected place has no location data'));
                        }
                    } else {
                        console.error('Navigation failed:', status);
                        reject(new Error(`Navigation failed: ${status}`));
                    }
                });
            });
        } catch (error) {
            console.error('Navigation error:', error);
            throw error;
        }
    }

    async searchNearby(location) {
        try {
            console.log('Starting nearby search for location:', location);
            
            // Get the Places service
            const service = new google.maps.places.PlacesService(this.mapManager.getMap());
            
            // Extract actual coordinates from the location object
            const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
            const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
            const actualLocation = { lat, lng };
            
            // Get current map bounds and calculate base radius
            const mapInfo = this.mapManager.getMapBoundsAndRadius();
            const baseRadius = mapInfo.radius;
            
            console.log('Using map-based search radius:', baseRadius, 'meters');
            
            // Get selected place types
            const selectedTypes = this.getSelectedPlaceTypes();
            console.log('Searching for place types:', selectedTypes);
            
            const allResults = [];
            
            for (const placeType of selectedTypes) {
                console.log(`Searching for ${placeType}...`);
                
                // Use multiple search strategies based on current map view
                const searchStrategies = [
                    { radius: baseRadius, name: 'map-view' },
                    { radius: Math.min(baseRadius * 1.5, 50000), name: 'expanded' },
                    { radius: Math.min(baseRadius * 2, 50000), name: 'wide' }
                ];
                
                console.log(`Search strategies for ${placeType}:`, searchStrategies);
                
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
                return uniqueResults;
            } else {
                console.error('No places found for any selected types');
                console.log('Trying fallback textSearch...');
                return await this.fallbackTextSearch(actualLocation, service, baseRadius);
            }
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    async fallbackTextSearch(location, service, baseRadius) {
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

        return new Promise((resolve) => {
            searchQueries.forEach((query, index) => {
                service.textSearch({
                    query: query,
                    location: location,
                    radius: baseRadius
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
                        resolve(uniqueResults);
                    }
                });
            });
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

    // Test method for debugging - can be called from console
    testSearch() {
        console.log('Testing search with Tel Aviv location...');
        const testLocation = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv
        this.mapManager.navigateToLocation(testLocation);
        return this.searchNearby(testLocation);
    }

    // Helper methods for UI feedback
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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchService;
} 