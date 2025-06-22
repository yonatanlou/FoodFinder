// UI Manager - Handles UI updates, markers, sidebar, and info windows
class UIManager {
    constructor(mapManager, filterManager) {
        this.mapManager = mapManager;
        this.filterManager = filterManager;
        this.markers = [];
    }

    displayPlaces() {
        try {
            const places = this.filterManager.getFilteredPlaces();
            console.log('Displaying places:', places);
            
            // Clear existing markers
            this.clearMarkers();
            
            if (places.length === 0) {
                console.log('No places to display');
                this.updateRestaurantsSidebar();
                return;
            }
            
            // Add markers for each place
            places.forEach(place => {
                this.addMarker(place);
            });
            
            // Update sidebar
            this.updateRestaurantsSidebar();
            
            console.log(`Displayed ${places.length} places on map`);
        } catch (error) {
            console.error('Error displaying places:', error);
        }
    }

    addMarker(place) {
        try {
            if (!place.geometry || !place.geometry.location) {
                console.warn('Place has no geometry:', place);
                return;
            }
            
            const position = place.geometry.location;
            const icon = this.getMarkerIcon(place);
            
            const marker = new google.maps.Marker({
                position: position,
                map: this.mapManager.getMap(),
                title: place.name,
                icon: icon
            });
            
            // Add click listener
            marker.addListener('click', () => {
                this.showPlaceDetails(place, marker);
            });
            
            this.markers.push(marker);
        } catch (error) {
            console.error('Error adding marker:', error);
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    getMarkerIcon(place) {
        // Determine icon based on place type and rating
        let iconColor = 'red'; // Default
        
        if (place.rating >= 4.5) {
            iconColor = 'green';
        } else if (place.rating >= 4.0) {
            iconColor = 'yellow';
        } else if (place.rating >= 3.5) {
            iconColor = 'orange';
        }
        
        // Check if place has keyword issues
        if (place.keywordCount && place.keywordCount > 0) {
            iconColor = 'red'; // Override with red for places with keyword issues
        }
        
        return {
            url: `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
        };
    }

    showPlaceDetails(place, marker) {
        try {
            const infoWindow = this.mapManager.getInfoWindow();
            
            // Calculate distance if we have a reference point
            let distanceInfo = '';
            if (this.mapManager.lastSearchLocation) {
                const distance = this.filterManager.calculateDistance(this.mapManager.lastSearchLocation, place);
                distanceInfo = `<div class="text-sm text-gray-600 mb-2">Distance: ${distance.toFixed(1)} km</div>`;
            }
            
            // Create info window content
            const content = `
                <div class="p-4 max-w-sm">
                    <div class="flex items-center gap-2 mb-2">
                        ${place.icon ? `<img src="${place.icon}" alt="Place icon" class="w-6 h-6">` : ''}
                        <h3 class="text-lg font-semibold text-gray-900">${place.name}</h3>
                    </div>
                    ${distanceInfo}
                    <div class="text-sm text-gray-600 mb-2">${place.formatted_address || 'Address not available'}</div>
                    <div class="flex items-center mb-2">
                        <span class="text-yellow-500">★</span>
                        <span class="ml-1 text-sm">${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</span>
                        <span class="ml-2 text-sm text-gray-500">${place.price_level ? '💰'.repeat(place.price_level) : 'N/A'}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">
                        Weighted Rating: ${place.weightedRating || 'N/A'}<br>
                        Keyword Count: ${place.keywordCount || 0}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="window.openInGoogleMaps('${place.place_id}')" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                            View on Google Maps
                        </button>
                    </div>
                </div>
            `;
            
            infoWindow.setContent(content);
            infoWindow.open(this.mapManager.getMap(), marker);
            
            // Make the openInGoogleMaps function available globally
            window.openInGoogleMaps = (placeId) => {
                this.openInGoogleMaps(placeId);
            };
            
        } catch (error) {
            console.error('Error showing place details:', error);
        }
    }

    openInGoogleMaps(placeId) {
        try {
            // Find the place by ID
            const places = this.filterManager.getFilteredPlaces();
            const place = places.find(p => p.place_id === placeId);
            
            if (!place) {
                console.error('Place not found:', placeId);
                return;
            }
            
            let url;
            
            // Try to use place_id first (most accurate)
            if (place.place_id) {
                url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
            } else if (place.geometry && place.geometry.location) {
                // Fallback to coordinates
                const lat = typeof place.geometry.location.lat === 'function' 
                    ? place.geometry.location.lat() 
                    : place.geometry.location.lat;
                const lng = typeof place.geometry.location.lng === 'function' 
                    ? place.geometry.location.lng() 
                    : place.geometry.location.lng;
                url = `https://www.google.com/maps?q=${lat},${lng}`;
            } else if (place.formatted_address) {
                // Fallback to address
                url = `https://www.google.com/maps/search/${encodeURIComponent(place.formatted_address)}`;
            } else {
                console.error('No location data available for place:', place);
                return;
            }
            
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening Google Maps:', error);
        }
    }

    openInGoogleMapsFromSidebar(placeId) {
        this.openInGoogleMaps(placeId);
    }

    updateRestaurantsSidebar() {
        try {
            const places = this.filterManager.getFilteredPlaces();
            const sidebar = document.getElementById('restaurantsList');
            
            if (!sidebar) {
                console.error('Restaurants sidebar not found');
                return;
            }
            
            if (places.length === 0) {
                sidebar.innerHTML = `
                    <div class="p-4 text-center text-gray-500">
                        No places found. Search for a location to see results.
                    </div>
                `;
                return;
            }
            
            // Create sidebar content
            const placesHTML = places.map(place => {
                // Calculate distance if we have a reference point
                let distanceInfo = '';
                if (this.mapManager.lastSearchLocation) {
                    const distance = this.filterManager.calculateDistance(this.mapManager.lastSearchLocation, place);
                    distanceInfo = `<div class="text-xs text-gray-500">${distance.toFixed(1)} km away</div>`;
                }
                
                // Get price level display
                const priceLevel = place.price_level || 0;
                const priceLevelText = priceLevel > 0 ? '💰'.repeat(priceLevel) : 'N/A';
                
                // Get place icon
                const placeIcon = place.icon || '';
                
                return `
                    <div class="restaurant-item p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50" 
                         onclick="window.showPlaceDetailsFromSidebar('${place.place_id}')">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    ${placeIcon ? `<img src="${placeIcon}" alt="Place icon" class="w-4 h-4">` : ''}
                                    <h3 class="font-medium text-gray-900">${place.name}</h3>
                                </div>
                                <div class="text-sm text-gray-600">${place.formatted_address || 'Address not available'}</div>
                                <div class="flex items-center mt-1">
                                    <span class="text-yellow-500 text-sm">★</span>
                                    <span class="ml-1 text-sm text-gray-600">${place.rating || 'N/A'} (${place.user_ratings_total || 0})</span>
                                    <span class="ml-2 text-sm text-gray-500">${priceLevelText}</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">
                                    Weighted: ${place.weightedRating || 'N/A'} | Keywords: ${place.keywordCount || 0}
                                </div>
                                ${distanceInfo}
                            </div>
                            <button onclick="event.stopPropagation(); window.openInGoogleMapsFromSidebar('${place.place_id}')" 
                                    class="ml-2 p-1 text-gray-400 hover:text-blue-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            sidebar.innerHTML = placesHTML;
            
            // Make functions available globally
            window.showPlaceDetailsFromSidebar = (placeId) => {
                this.showPlaceDetailsFromSidebar(placeId);
            };
            
            window.openInGoogleMapsFromSidebar = (placeId) => {
                this.openInGoogleMapsFromSidebar(placeId);
            };
            
        } catch (error) {
            console.error('Error updating restaurants sidebar:', error);
        }
    }

    showPlaceDetailsFromSidebar(placeId) {
        try {
            const places = this.filterManager.getFilteredPlaces();
            const place = places.find(p => p.place_id === placeId);
            
            if (!place) {
                console.error('Place not found:', placeId);
                return;
            }
            
            // Find the marker for this place
            const marker = this.markers.find(m => {
                const markerPos = m.getPosition();
                const placePos = place.geometry.location;
                return markerPos.lat() === placePos.lat() && markerPos.lng() === placePos.lng();
            });
            
            if (marker) {
                this.showPlaceDetails(place, marker);
            } else {
                console.warn('Marker not found for place:', place);
            }
        } catch (error) {
            console.error('Error showing place details from sidebar:', error);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
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
    module.exports = UIManager;
}
