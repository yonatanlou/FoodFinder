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
                <div class="p-6 max-w-sm bg-white rounded-2xl shadow-2xl border border-white/20">
                    <div class="flex items-center gap-3 mb-4">
                        ${place.icon ? `<img src="${place.icon}" alt="Place icon" class="w-8 h-8 rounded-lg">` : ''}
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 leading-tight">${place.name}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">${place.types ? place.types[0] : 'Place'}</span>
                                <span class="text-xs text-gray-300">•</span>
                                <span class="text-xs text-gray-500">${place.price_level ? '💰'.repeat(place.price_level) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${distanceInfo}
                    
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-700 mb-2">${place.formatted_address || 'Address not available'}</div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-yellow-500 text-sm mr-1">${'⭐'.repeat(Math.floor(place.rating || 0))}${'☆'.repeat(5 - Math.floor(place.rating || 0))}</span>
                                <span class="text-sm font-medium text-gray-900">${place.rating || 'N/A'}</span>
                                <span class="text-sm text-gray-500 ml-1">(${place.user_ratings_total || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="p-3 bg-primary-50 rounded-lg">
                            <div class="text-xs text-primary-600 font-medium mb-1">Weighted Rating</div>
                            <div class="text-sm font-bold text-primary-700">${place.weightedRating || 'N/A'}</div>
                        </div>
                        <div class="p-3 bg-secondary-50 rounded-lg">
                            <div class="text-xs text-secondary-600 font-medium mb-1">Keyword Count</div>
                            <div class="text-sm font-bold text-secondary-700">${place.keywordCount || 0}</div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button onclick="window.openInGoogleMaps('${place.place_id}')" class="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 shadow-lg">
                            <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                            </svg>
                            Open in Maps
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
                    <div class="p-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <p class="text-sm font-medium">No places found</p>
                        <p class="text-xs mt-1">Search for a location to see results</p>
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
                    distanceInfo = `<div class="text-xs text-gray-500 flex items-center mt-1">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1 1 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        ${distance.toFixed(1)} km away
                    </div>`;
                }
                
                // Get price level display
                const priceLevel = place.price_level || 0;
                const priceLevelText = priceLevel > 0 ? '💰'.repeat(priceLevel) : 'N/A';
                
                // Get place icon
                const placeIcon = place.icon || '';
                
                // Get rating display
                const rating = place.rating || 0;
                const stars = '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
                
                return `
                    <div class="restaurant-item p-4 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl cursor-pointer hover:bg-white/80 transition-all duration-200" 
                         onclick="window.showPlaceDetailsFromSidebar('${place.place_id}')">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    ${placeIcon ? `<img src="${placeIcon}" alt="Place icon" class="w-5 h-5 rounded">` : ''}
                                    <h3 class="font-semibold text-gray-900 text-sm leading-tight">${place.name}</h3>
                                </div>
                                <div class="text-xs text-gray-600 mb-2 line-clamp-2">${place.formatted_address || 'Address not available'}</div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-xs text-yellow-600 mr-1">${stars}</span>
                                        <span class="text-xs font-medium text-gray-700 mr-1">${rating.toFixed(1)}</span>
                                        <span class="text-xs text-gray-600">(${place.user_ratings_total || 0})</span>
                                    </div>
                                    <span class="text-xs text-gray-500">${priceLevelText}</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2 flex items-center gap-4">
                                    <span class="flex items-center">
                                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        ${place.weightedRating || 'N/A'}
                                    </span>
                                    <span class="flex items-center">
                                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                        ${place.keywordCount || 0}
                                    </span>
                                </div>
                                ${distanceInfo}
                            </div>
                            <button onclick="event.stopPropagation(); window.openInGoogleMapsFromSidebar('${place.place_id}')" 
                                    class="ml-2 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
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
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 1000;
            font-weight: 600;
            max-width: 80%;
            text-align: center;
            box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideUp 0.3s ease-out;
        `;
        successDiv.innerHTML = `
            <div class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${message}
            </div>
        `;
        document.body.appendChild(successDiv);
        
        // Remove success after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.parentNode.removeChild(successDiv);
                    }
                }, 300);
            }
        }, 3000);
    }

    showError(message) {
        try {
            // Create or update error notification
            let errorDiv = document.getElementById('errorNotification');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'errorNotification';
                errorDiv.className = 'fixed top-4 right-4 z-50 max-w-sm';
                document.body.appendChild(errorDiv);
            }
            
            errorDiv.innerHTML = `
                <div class="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400/20 transform transition-all duration-300 animate-slide-in">
                    <div class="flex items-center space-x-3">
                        <div class="w-6 h-6 bg-red-400 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm">Error</h4>
                            <p class="text-sm opacity-90">${message}</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.remove();
                }
            }, 5000);
            
        } catch (error) {
            console.error('Error showing error notification:', error);
        }
    }

    // Toggle filter sections
    toggleFilter(filterId) {
        try {
            const filterSection = document.querySelector(`[onclick="toggleFilter('${filterId}')"]`).closest('.filter-section');
            const content = filterSection.querySelector('.filter-content');
            const arrow = filterSection.querySelector('.filter-arrow');
            
            // Toggle visibility
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        } catch (error) {
            console.error('Error toggling filter:', error);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

// Make toggleFilter available globally
window.toggleFilter = function(filterId) {
    // This will be called from HTML onclick handlers
    // The actual implementation is in the UIManager class
    // We'll need to access the UI manager instance
    if (window.app && window.app.uiManager) {
        window.app.uiManager.toggleFilter(filterId);
    }
};
