// Google Maps Integration

let map;
let directionsService;
let directionsRenderer;
let autocompleteOrigin;
let autocompleteDestination;

// Initialize Google Maps
function initMap(elementId, options = {}) {
  const defaultOptions = {
    center: { lat: 28.6139, lng: 77.2090 }, // Delhi, India
    zoom: 12,
    styles: [
      {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [{ "color": "#1e293b" }]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#cbd5e1" }]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#0f172a" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#334155" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#0f172a" }]
      }
    ],
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  };

  const mapOptions = { ...defaultOptions, ...options };
  map = new google.maps.Map(document.getElementById(elementId), mapOptions);
  
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#6366f1',
      strokeWeight: 5,
      strokeOpacity: 0.8
    }
  });

  return map;
}

// Initialize autocomplete for input fields
function initAutocomplete(inputId, onPlaceSelected) {
  const input = document.getElementById(inputId);
  if (!input) return null;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'in' },
    fields: ['address_components', 'geometry', 'formatted_address', 'name']
  });

  if (onPlaceSelected) {
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        onPlaceSelected(place);
      }
    });
  }

  return autocomplete;
}

// Calculate and display route
async function calculateRoute(origin, destination) {
  if (!directionsService || !directionsRenderer) {
    console.error('Maps not initialized');
    return null;
  }

  try {
    const request = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const routeInfo = {
            distance: leg.distance.text,
            distanceValue: leg.distance.value, // in meters
            duration: leg.duration.text,
            durationValue: leg.duration.value, // in seconds
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            startLocation: {
              lat: leg.start_location.lat(),
              lng: leg.start_location.lng()
            },
            endLocation: {
              lat: leg.end_location.lat(),
              lng: leg.end_location.lng()
            }
          };
          
          resolve(routeInfo);
        } else {
          reject(new Error('Directions request failed: ' + status));
        }
      });
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

// Add marker to map
function addMarker(position, options = {}) {
  const defaultOptions = {
    position: position,
    map: map,
    animation: google.maps.Animation.DROP
  };

  const markerOptions = { ...defaultOptions, ...options };
  return new google.maps.Marker(markerOptions);
}

// Add multiple markers
function addMarkers(locations) {
  const markers = [];
  const bounds = new google.maps.LatLngBounds();

  locations.forEach((location, index) => {
    const marker = addMarker(location.position, {
      title: location.title,
      label: location.label,
      icon: location.icon
    });

    if (location.infoWindow) {
      const infoWindow = new google.maps.InfoWindow({
        content: location.infoWindow
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    }

    markers.push(marker);
    bounds.extend(location.position);
  });

  // Fit map to show all markers
  if (locations.length > 1) {
    map.fitBounds(bounds);
  } else if (locations.length === 1) {
    map.setCenter(locations[0].position);
    map.setZoom(14);
  }

  return markers;
}

// Clear all markers
function clearMarkers(markers) {
  if (markers && markers.length > 0) {
    markers.forEach(marker => marker.setMap(null));
  }
}

// Geocode address to coordinates
async function geocodeAddress(address) {
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK') {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address
        });
      } else {
        reject(new Error('Geocoding failed: ' + status));
      }
    });
  });
}

// Reverse geocode coordinates to address
async function reverseGeocode(lat, lng) {
  const geocoder = new google.maps.Geocoder();
  const latlng = { lat: lat, lng: lng };

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          resolve({
            formattedAddress: results[0].formatted_address,
            addressComponents: results[0].address_components
          });
        } else {
          reject(new Error('No results found'));
        }
      } else {
        reject(new Error('Reverse geocoding failed: ' + status));
      }
    });
  });
}

// Get user's current location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}

// Center map on user's location
async function centerOnUserLocation() {
  try {
    const location = await getCurrentLocation();
    map.setCenter(location);
    map.setZoom(14);
    
    addMarker(location, {
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#6366f1',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });
    
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    showToast('Unable to get your location', 'error');
    throw error;
  }
}

// Calculate distance between two points using Distance Matrix API
async function calculateDistance(origins, destinations) {
  const service = new google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: origins,
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        if (status === 'OK') {
          const results = [];
          
          response.rows.forEach((row, i) => {
            row.elements.forEach((element, j) => {
              if (element.status === 'OK') {
                results.push({
                  origin: origins[i],
                  destination: destinations[j],
                  distance: element.distance.text,
                  distanceValue: element.distance.value,
                  duration: element.duration.text,
                  durationValue: element.duration.value
                });
              }
            });
          });
          
          resolve(results);
        } else {
          reject(new Error('Distance Matrix request failed: ' + status));
        }
      }
    );
  });
}

// Create custom marker icon
function createCustomMarker(color = '#6366f1', label = '') {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 2,
    scale: 1.5,
    anchor: new google.maps.Point(12, 24),
    labelOrigin: new google.maps.Point(12, 9)
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMap,
    initAutocomplete,
    calculateRoute,
    addMarker,
    addMarkers,
    clearMarkers,
    geocodeAddress,
    reverseGeocode,
    getCurrentLocation,
    centerOnUserLocation,
    calculateDistance,
    createCustomMarker
  };
}
