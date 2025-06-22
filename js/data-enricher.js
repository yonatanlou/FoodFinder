// Data Enricher - Handles data enrichment and sample data generation
class DataEnricher {
    constructor(config) {
        this.config = config;
    }

    async enrichPlacesData(places) {
        try {
            console.log('Enriching places data...');
            
            const enrichedPlaces = [];
            const service = new google.maps.places.PlacesService(document.createElement('div'));
            
            for (const place of places) {
                try {
                    console.log('Processing place:', place.name, place);
                    
                    // Get place details using the modern approach with additional fields
                    const detailsRequest = {
                        placeId: place.place_id,
                        fields: [
                            'name', 
                            'geometry', 
                            'formatted_address', 
                            'rating', 
                            'user_ratings_total', 
                            'place_id', 
                            'types',
                            'icon',
                            'price_level',
                            'reviews'
                        ]
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
                    
                    const enrichedPlace = detailsResult || place;
                    
                    // Add custom data (sample reviews, weighted rating, etc.)
                    const enrichedWithCustomData = this.generateSampleData(enrichedPlace);
                    
                    enrichedPlaces.push(enrichedWithCustomData);
                } catch (error) {
                    console.warn('Error getting place details:', error);
                    const enrichedWithCustomData = this.generateSampleData(place);
                    enrichedPlaces.push(enrichedWithCustomData);
                }
            }
            
            console.log('Enriched places before processing:', enrichedPlaces);
            return enrichedPlaces;
        } catch (error) {
            console.error('Error enriching places data:', error);
            throw error;
        }
    }

    generateSampleData(place) {
        try {
            // Generate sample reviews and calculate weighted rating
            const sampleReviews = this.generateSampleReviews(place);
            const weightedRating = this.calculateWeightedRating(place, sampleReviews);
            const keywordCount = this.countKeywordOccurrences(sampleReviews, this.config.APP_CONFIG.defaultKeyword);
            
            return {
                ...place,
                customData: {
                    reviews: sampleReviews
                },
                weightedRating: weightedRating,
                keywordCount: keywordCount
            };
        } catch (error) {
            console.error('Error generating sample data:', error);
            return place;
        }
    }

    generateSampleReviews(place) {
        // Generate realistic sample reviews based on place rating
        const numReviews = Math.floor(Math.random() * 20) + 5; // 5-25 reviews
        const reviews = [];
        
        for (let i = 0; i < numReviews; i++) {
            const reviewRating = this.generateReviewRating(place.rating || 3.5);
            const reviewText = this.generateReviewText(reviewRating, place.name);
            
            reviews.push({
                rating: reviewRating,
                text: reviewText,
                author: `User${i + 1}`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return reviews;
    }

    generateReviewRating(placeRating) {
        // Generate review ratings that cluster around the place's overall rating
        const baseRating = placeRating || 3.5;
        const variance = 1.0; // How much variation in individual reviews
        
        let rating = baseRating + (Math.random() - 0.5) * variance * 2;
        rating = Math.max(1, Math.min(5, rating)); // Clamp between 1 and 5
        return Math.round(rating * 10) / 10; // Round to 1 decimal place
    }

    generateReviewText(rating, placeName) {
        const positivePhrases = [
            "Great food and service!",
            "Excellent experience, highly recommend.",
            "Amazing atmosphere and delicious food.",
            "Best place I've been to in a while.",
            "Friendly staff and quick service.",
            "Fresh ingredients and great taste.",
            "Cozy atmosphere, perfect for dining.",
            "Outstanding quality and reasonable prices."
        ];
        
        const neutralPhrases = [
            "Decent food, nothing special.",
            "Average experience overall.",
            "Food was okay, service was fine.",
            "Not bad, but not amazing either.",
            "Standard fare, meets expectations.",
            "Reasonable prices for the quality.",
            "Typical restaurant experience."
        ];
        
        const negativePhrases = [
            "Disappointing food quality.",
            "Service was slow and unfriendly.",
            "Overpriced for what you get.",
            "Food was cold and tasteless.",
            "Would not recommend this place.",
            "Poor hygiene standards.",
            "Terrible experience overall."
        ];
        
        let phrases = [];
        if (rating >= 4.0) {
            phrases = positivePhrases;
        } else if (rating >= 3.0) {
            phrases = neutralPhrases;
        } else {
            phrases = negativePhrases;
        }
        
        // Randomly select 1-3 phrases
        const numPhrases = Math.floor(Math.random() * 3) + 1;
        const selectedPhrases = [];
        
        for (let i = 0; i < numPhrases; i++) {
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            if (!selectedPhrases.includes(phrase)) {
                selectedPhrases.push(phrase);
            }
        }
        
        return selectedPhrases.join(' ');
    }

    calculateWeightedRating(place, reviews) {
        try {
            const baseRating = place.rating || 3.5;
            const reviewCount = place.user_ratings_total || reviews.length;
            
            // Calculate weighted rating: (average rating × number of reviewers)
            const weightedRating = baseRating * reviewCount;
            
            return Math.round(weightedRating * 10) / 10; // Round to 1 decimal place
        } catch (error) {
            console.error('Error calculating weighted rating:', error);
            return 0;
        }
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
            const service = new google.maps.places.PlacesService(document.createElement('div'));
            
            // Test with nearbySearch which respects location bounds
            return new Promise((resolve) => {
                service.nearbySearch({
                    location: testLocation,
                    radius: 1000,
                    type: 'restaurant'
                }, (results, status) => {
                    console.log('API Test Results:', {
                        status: status,
                        statusText: this.getStatusText(status),
                        resultsCount: results ? results.length : 0,
                        hasResults: results && results.length > 0
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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataEnricher;
}
