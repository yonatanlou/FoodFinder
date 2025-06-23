// Filter Manager - Handles filtering and sorting of places
class FilterManager {
    constructor() {
        this.places = [];
        this.filteredPlaces = [];
    }

    setPlaces(places) {
        this.places = places;
        this.filteredPlaces = [...places];
    }

    applyFilters() {
        if (!this.places || this.places.length === 0) {
            throw new Error('No places to filter. Please search for places first.');
        }

        const weightedRatingEnabled = document.getElementById('weightedRatingEnabled').checked;
        const keywordEnabled = document.getElementById('keywordEnabled').checked;
        const priceLevelEnabled = document.getElementById('priceLevelEnabled').checked;
        
        const weightedRatingThreshold = parseFloat(document.getElementById('weightedRatingThreshold').value) || 0;
        const keyword = document.getElementById('keywordInput').value.toLowerCase();
        const keywordMinThreshold = parseInt(document.getElementById('keywordMinThreshold').value) || 0;
        const keywordThreshold = parseInt(document.getElementById('keywordThreshold').value) || 0;
        const priceLevelMin = parseInt(document.getElementById('priceLevelMin').value) || 0;
        const priceLevelMax = parseInt(document.getElementById('priceLevelMax').value) || 0;

        console.log('Applying filters:', {
            weightedRatingEnabled,
            keywordEnabled,
            priceLevelEnabled,
            weightedRatingThreshold,
            keyword,
            keywordMinThreshold,
            keywordThreshold,
            priceLevelMin,
            priceLevelMax
        });

        this.filteredPlaces = this.places.filter(place => {
            // Always exclude permanently closed places
            if (place.permanently_closed === true) {
                return false;
            }

            let passesWeightedRating = true;
            let passesKeyword = true;
            let passesPriceLevel = true;

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

            // Apply price level filter
            if (priceLevelEnabled) {
                const priceLevel = place.price_level || 0;
                
                if (priceLevelMin > 0 && priceLevel < priceLevelMin) {
                    passesPriceLevel = false;
                }
                if (priceLevelMax > 0 && priceLevel > priceLevelMax) {
                    passesPriceLevel = false;
                }
            }

            return passesWeightedRating && passesKeyword && passesPriceLevel;
        });

        console.log(`Filtered ${this.places.length} places down to ${this.filteredPlaces.length}`);
        
        // Apply sorting to filtered places
        this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
        
        return this.filteredPlaces;
    }

    countKeywordOccurrences(reviews, keyword) {
        if (!reviews || !Array.isArray(reviews) || !keyword) {
            return 0;
        }
        
        let count = 0;
        reviews.forEach(review => {
            if (review.text && typeof review.text === 'string') {
                const lowerText = review.text.toLowerCase();
                const keywordLower = keyword.toLowerCase();
                const matches = (lowerText.match(new RegExp(keywordLower, 'g')) || []).length;
                count += matches;
            }
        });
        
        return count;
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
            case 'price-level':
                sortedPlaces.sort((a, b) => (b.price_level || 0) - (a.price_level || 0));
                break;
            case 'price-level-asc':
                sortedPlaces.sort((a, b) => (a.price_level || 0) - (b.price_level || 0));
                break;
            case 'distance':
                // Distance sorting requires a reference point - this will be handled by the UI manager
                break;
            default:
                // Default to name sorting
                sortedPlaces.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        
        return sortedPlaces;
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(point1, place) {
        if (!point1 || !place.geometry || !place.geometry.location) {
            return Infinity;
        }
        
        const lat1 = point1.lat;
        const lng1 = point1.lng;
        
        const lat2 = typeof place.geometry.location.lat === 'function' 
            ? place.geometry.location.lat() 
            : place.geometry.location.lat;
        const lng2 = typeof place.geometry.location.lng === 'function' 
            ? place.geometry.location.lng() 
            : place.geometry.location.lng;
        
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

    // Sort by distance from a specific point
    sortByDistance(places, referencePoint) {
        if (!referencePoint) {
            return places;
        }
        
        const sortedPlaces = [...places];
        sortedPlaces.sort((a, b) => {
            const distanceA = this.calculateDistance(referencePoint, a);
            const distanceB = this.calculateDistance(referencePoint, b);
            return distanceA - distanceB;
        });
        
        return sortedPlaces;
    }

    getPlaces() {
        return this.places;
    }

    getFilteredPlaces() {
        return this.filteredPlaces;
    }

    updateResultsCount() {
        document.getElementById('totalResults').textContent = this.places.length;
        document.getElementById('filteredResults').textContent = this.filteredPlaces.length;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterManager;
}
