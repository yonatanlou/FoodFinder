// Diagnostic script for Google Maps API issues
// Add this to your browser console to diagnose problems

function diagnoseGoogleMapsAPI() {
    console.log('🔍 Starting Google Maps API Diagnosis...');
    console.log('=====================================');
    
    // Check if config is loaded
    console.log('1. Configuration Check:');
    if (typeof CONFIG !== 'undefined') {
        console.log('   ✅ CONFIG object found');
        if (CONFIG.GOOGLE_MAPS_API_KEY) {
            console.log('   ✅ Google Maps API key present');
            console.log('   📝 API Key starts with:', CONFIG.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
        } else {
            console.log('   ❌ Google Maps API key missing');
        }
    } else {
        console.log('   ❌ CONFIG object not found');
    }
    
    // Check if Google Maps is loaded
    console.log('\n2. Google Maps API Check:');
    if (typeof google !== 'undefined') {
        console.log('   ✅ Google object found');
        if (google.maps) {
            console.log('   ✅ Google Maps API loaded');
            if (google.maps.places) {
                console.log('   ✅ Places API available');
            } else {
                console.log('   ❌ Places API not available');
            }
        } else {
            console.log('   ❌ Google Maps API not loaded');
        }
    } else {
        console.log('   ❌ Google object not found');
    }
    
    // Test API key directly
    console.log('\n3. API Key Test:');
    if (CONFIG && CONFIG.GOOGLE_MAPS_API_KEY) {
        const testUrl = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places`;
        console.log('   🔗 Testing API key at:', testUrl);
        
        fetch(testUrl)
            .then(response => {
                if (response.ok) {
                    console.log('   ✅ API key is valid');
                } else {
                    console.log('   ❌ API key is invalid or restricted');
                    console.log('   📊 Response status:', response.status);
                }
            })
            .catch(error => {
                console.log('   ❌ Error testing API key:', error.message);
            });
    }
    
    // Check for common errors
    console.log('\n4. Common Issues Check:');
    
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    console.log('   🌐 Running on localhost:', isLocalhost);
    
    if (isLocalhost) {
        console.log('   💡 Tip: Make sure API key restrictions allow localhost:8000');
    }
    
    // Check if billing might be the issue
    console.log('   💳 Billing: Check if billing is enabled in Google Cloud Console');
    
    // Check if required APIs are enabled
    console.log('   🔧 APIs: Make sure Maps JavaScript API and Places API are enabled');
    
    console.log('\n=====================================');
    console.log('🔍 Diagnosis complete. Check the results above.');
}

// Test Places API functionality
function testPlacesAPI() {
    console.log('🧪 Testing Places API functionality...');
    
    if (!google || !google.maps || !google.maps.places) {
        console.log('❌ Places API not available');
        return;
    }
    
    // Create a temporary map for testing
    const testDiv = document.createElement('div');
    testDiv.style.width = '100px';
    testDiv.style.height = '100px';
    testDiv.style.position = 'absolute';
    testDiv.style.top = '-9999px';
    document.body.appendChild(testDiv);
    
    const testMap = new google.maps.Map(testDiv, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12
    });
    
    const service = new google.maps.places.PlacesService(testMap);
    
    // Test with a simple search
    const request = {
        query: 'McDonald\'s',
        fields: ['name', 'geometry']
    };
    
    service.findPlaceFromQuery(request, (results, status) => {
        console.log('🔍 Places API Test Results:');
        console.log('   Status:', status);
        console.log('   Results count:', results ? results.length : 0);
        
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log('   ✅ Places API is working correctly');
        } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            console.log('   ❌ Places API access denied - check API key and billing');
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            console.log('   ⚠️ Places API quota exceeded');
        } else {
            console.log('   ❌ Places API error:', status);
        }
        
        // Clean up
        document.body.removeChild(testDiv);
    });
}

// Run diagnostics
function runFullDiagnosis() {
    diagnoseGoogleMapsAPI();
    
    // Wait a bit then test Places API
    setTimeout(() => {
        testPlacesAPI();
    }, 2000);
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
    console.log('🔧 Diagnostic script loaded. Run runFullDiagnosis() to test everything.');
    console.log('📝 Or run diagnoseGoogleMapsAPI() or testPlacesAPI() individually.');
} 