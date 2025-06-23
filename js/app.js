// PlacesFinder Application - Main Controller
// This is the simplified main app that coordinates all modules

class PlacesFinderApp {
    constructor() {
        this.config = CONFIG; // Use config from config.js
        this.mapManager = null;
        this.searchService = null;
        this.filterManager = null;
        this.uiManager = null;
        this.dataEnricher = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing PlacesFinder app...');
            
            // Load Google Maps API
            await this.loadGoogleMapsAPI();
            
            // Initialize all managers
            this.initializeManagers();
            
            // Test the API with a simple location
            await this.dataEnricher.testPlacesAPI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup autocomplete
            this.searchService.setupAutocomplete();
            
            console.log('PlacesFinder app initialized successfully');
            this.uiManager.showSuccess('Map loaded successfully!');
        } catch (error) {
            console.error('App initialization error:', error);
            this.uiManager.showError('Failed to initialize app: ' + error.message);
        }
    }

    initializeManagers() {
        // Initialize all managers in dependency order
        this.mapManager = new MapManager(this.config);
        this.filterManager = new FilterManager();
        this.uiManager = new UIManager(this.mapManager, this.filterManager);
        this.searchService = new SearchService(this.mapManager, this.config);
        this.dataEnricher = new DataEnricher(this.config);
        
        // Initialize map
        this.mapManager.initializeMap();
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
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.GOOGLE_MAPS_API_KEY}&libraries=places&language=en&callback=initPlacesFinderApp`;
            script.async = true;
            script.defer = true;
            
            // Create global callback function
            window.initPlacesFinderApp = () => {
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

    setupEventListeners() {
        // Search button - navigates to the searched location
        document.getElementById('searchButton').addEventListener('click', () => {
            this.handleNavigation();
        });

        // Search input enter key - navigates to the searched location
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleNavigation();
            }
        });

        // Apply filters button - searches for places at current map center
        document.getElementById('applyFiltersButton').addEventListener('click', () => {
            this.handleSearchAndFilter();
        });

        // Sort dropdown change
        document.getElementById('sortBy').addEventListener('change', () => {
            this.handleSortChange();
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

    async handleNavigation() {
        try {
            const query = document.getElementById('searchInput').value.trim();
            this.uiManager.showLoading(true);
            
            const result = await this.searchService.performNavigation(query);
            
            this.uiManager.showSuccess(`Navigated to ${result.placeName}! Click "Apply Filters" to search for places here.`);
        } catch (error) {
            console.error('Navigation error:', error);
            this.uiManager.showError(error.message);
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async handleSearchAndFilter() {
        try {
            this.uiManager.showLoading(true);
            
            // Get current map center
            const currentCenter = this.mapManager.getCurrentCenter();
            
            // Search for places
            const searchResults = await this.searchService.searchNearby(currentCenter);
            
            if (searchResults.length === 0) {
                this.uiManager.showError('No nearby places found. Please try a different location or place types.');
                return;
            }
            
            // Enrich the data
            const enrichedPlaces = await this.dataEnricher.enrichPlacesData(searchResults);
            
            // Set places in filter manager
            this.filterManager.setPlaces(enrichedPlaces);
            
            // Apply filters
            this.filterManager.applyFilters();
            
            // Display results
            this.uiManager.displayPlaces();
            this.filterManager.updateResultsCount();
            
            // Ensure map stays centered
            this.mapManager.ensureMapCenteredOnSearch();
            
            this.uiManager.showSuccess(`Found ${searchResults.length} places nearby!`);
        } catch (error) {
            console.error('Search and filter error:', error);
            this.uiManager.showError(error.message);
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    handleSortChange() {
        try {
            const filteredPlaces = this.filterManager.getFilteredPlaces();
            if (filteredPlaces.length > 0) {
                console.log('Sort option changed, re-sorting places...');
                
                // Handle distance sorting specially
                const sortOption = this.filterManager.getCurrentSortOption();
                if (sortOption === 'distance' && this.mapManager.lastSearchLocation) {
                    this.filterManager.filteredPlaces = this.filterManager.sortByDistance(filteredPlaces, this.mapManager.lastSearchLocation);
                } else {
                    this.filterManager.filteredPlaces = this.filterManager.sortPlaces(filteredPlaces);
                }
                
                this.uiManager.displayPlaces();
            }
        } catch (error) {
            console.error('Sort change error:', error);
        }
    }

    async toggleAuth() {
        try {
            const authButton = document.getElementById('authButton');
            
            if (auth.currentUser) {
                await auth.signOut();
                authButton.textContent = 'Sign In';
            } else {
                await auth.signInAnonymously();
                authButton.textContent = 'Signed In';
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.uiManager.showError('Authentication failed: ' + error.message);
        }
    }

    // Debug methods
    debugMapState() {
        this.mapManager.debugMapState();
        console.log('App state:', {
            placesCount: this.filterManager.getPlaces().length,
            filteredPlacesCount: this.filterManager.getFilteredPlaces().length
        });
    }

    testSearch() {
        return this.searchService.testSearch();
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlacesFinderApp();
    // Make app available globally for debugging and filter toggles
    window.app = app;
}); 