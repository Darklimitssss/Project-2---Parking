/**
 * LEAFLET ROUTING MACHINE TUTORIAL
 * ================================
 * 
 * This tutorial demonstrates how to create a simple routing application
 * using Leaflet and Leaflet Routing Machine. The application allows
 * drivers and pedestrians to find routes to parking zones.
 * 
 * Features:
 * - Different routing for drivers and pedestrians
 * - Selectable parking zones
 * - Estimated arrival times
 * - Turn-by-turn directions
 */

// ----- GLOBAL VARIABLES -----
// These variables maintain the state of our application

let map;                // The Leaflet map object
let userMarker;         // Marker showing current user's position
let routeControl;       // The routing control object that handles routes
let userType = 'driver'; // Current user type (driver or passenger)
let userLocation = null; // User's current location
let meetingPoint = null; // Selected meeting point
let meetingPointMarker = null; // Marker for the meeting point
let passengerLocation = null; // Static location for the passenger
let estimatedArrivalTime = null; // ETA to the meeting point


// ----- APPLICATION INITIALIZATION -----
// This function runs when the page loads and sets up our application

function initApp() {
    console.log("Initializing application...");
    
    // Create our Leaflet map and center it on Calgary
    map = L.map('map').setView([51.0525571, -114.0730546], 13);
    
    // Add the OpenStreetMap tile layer - this provides the actual map imagery
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Set up event listeners for our user type toggle buttons
    document.getElementById('driver-btn').addEventListener('click', function() {
        setUserType('driver');
    });
    
    document.getElementById('passenger-btn').addEventListener('click', function() {
        setUserType('passenger');
    });
    
    // Display parking zones on the map
    displayParkingZones();
    
    // Initialize passenger location near the parking zone
    // For this tutorial, we'll set this as a static location
    passengerLocation = L.latLng(51.052250, -114.071000);
    
    // Get the user's location from the browser (for the driver)
    if (userType === 'driver') {
        getUserLocation();
    } else {
        // For passenger view, use the static passenger location
        setStaticPassengerView();
    }
    
    console.log("Application initialized successfully!");
}

// ----- USER TYPE MANAGEMENT -----
// This function handles switching between driver and passenger modes

function setUserType(type) {
    userType = type;
    
    // Update the active button styling
    document.getElementById('driver-btn').classList.toggle('active', type === 'driver');
    document.getElementById('passenger-btn').classList.toggle('active', type === 'passenger');
    
    // Reset the map view for the new user type
    resetMapForUserType();
    
    // Update UI based on user type
    updateStatusMessage();
    
    console.log(`User type changed to: ${type}`);
}

// ----- MAP RESET -----
// Resets the map when switching between user types

function resetMapForUserType() {
    // Clear existing route
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }
    
    // Clear existing markers
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    
    // Set up the appropriate view
    if (userType === 'driver') {
        getUserLocation();
    } else {
        setStaticPassengerView();
    }
}

// ----- STATIC PASSENGER VIEW -----
// For the tutorial, the passenger has a static location

function setStaticPassengerView() {
    // Set user location to the static passenger location
    userLocation = passengerLocation;
    
    // Create a marker for the passenger
    const markerIcon = L.divIcon({
        className: 'user-marker',
        html: '<div style="background-color: #32CD32; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [20, 20]
    });
    
    // Add the passenger marker to the map
    userMarker = L.marker(userLocation, { icon: markerIcon }).addTo(map);
    userMarker.bindPopup('You (Passenger)').openPopup();
    
    // Center the map on the passenger location with a closer zoom
    map.setView(userLocation, 16);
    
    // Update UI
    updateStatusMessage();
    
    console.log("Static passenger view set up");
}

// ----- GET USER LOCATION -----
// Gets the user's current location from the browser's geolocation API

function getUserLocation() {
    // Check if geolocation is available in this browser
    if (navigator.geolocation) {
        // Show a loading message
        document.getElementById('status-message').textContent = "Getting your location...";
        
        // Request the current position
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                // Extract coordinates
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Store the user's location
                userLocation = L.latLng(lat, lng);
                
                // Create a marker icon
                const markerIcon = L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background-color: #3388ff; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [20, 20]
                });
                
                // Add a marker to the map
                userMarker = L.marker(userLocation, { icon: markerIcon }).addTo(map);
                userMarker.bindPopup('You (Driver)').openPopup();
                
                // Center the map on the user's location
                map.setView(userLocation, 15);
                
                // Update the status message
                updateStatusMessage();
                
                console.log(`User location: ${lat}, ${lng}`);
            },
            // Error callback
            function(error) {
                console.error("Error getting location:", error);
                
                // Show an error message
                document.getElementById('status-message').textContent = 
                    "Could not get your location. Using default location.";
                
                // Use a default location (Calgary)
                userLocation = L.latLng(51.0525571, -114.0730546);
                
                // Add a marker for the default location
                userMarker = L.marker(userLocation).addTo(map);
                userMarker.bindPopup('Default Location (Could not get your location)').openPopup();
                
                // Center the map on the default location
                map.setView(userLocation, 13);
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        // Browser doesn't support geolocation
        console.error("Geolocation is not supported by this browser");
        document.getElementById('status-message').textContent = 
            "Geolocation is not supported by your browser. Using default location.";
        
        // Use a default location
        userLocation = L.latLng(51.0525571, -114.0730546);
        
        // Add a marker for the default location
        userMarker = L.marker(userLocation).addTo(map);
        userMarker.bindPopup('Default Location (Geolocation not supported)').openPopup();
        
        // Center the map on the default location
        map.setView(userLocation, 13);
    }
}

// ----- UPDATE STATUS MESSAGE -----
// Updates the status message in the UI

function updateStatusMessage() {
    const statusElement = document.getElementById('status-message');
    
    // Different messages based on state
    if (!userLocation) {
        statusElement.textContent = "Getting your location...";
    } else if (!meetingPoint) {
        statusElement.textContent = "Select a parking zone for your rendezvous.";
    } else {
        // Include ETA if available
        if (estimatedArrivalTime) {
            if (userType === 'driver') {
                statusElement.textContent = `We'll help you drive to the selected parking zone. ETA: ${estimatedArrivalTime}`;
            } else {
                statusElement.textContent = `We'll help you walk to the selected parking zone. ETA: ${estimatedArrivalTime}`;
            }
        } else {
            if (userType === 'driver') {
                statusElement.textContent = "We'll help you drive to the selected parking zone.";
            } else {
                statusElement.textContent = "We'll help you walk to the selected parking zone.";
            }
        }
    }
}

// ----- DISPLAY PARKING ZONES -----
// Adds parking zones to the map

function displayParkingZones() {
    // Example parking zones in Calgary
    const parkingZones = [
        {
            name: "City Hall Parkade",
            location: L.latLng(51.0453, -114.0585),
            capacity: 450,
            hourlyRate: "$3.00"
        },
        {
            name: "Eau Claire Market",
            location: L.latLng(51.0529, -114.0680),
            capacity: 350,
            hourlyRate: "$2.50"
        },
        {
            name: "Chinatown Parking",
            location: L.latLng(51.0505, -114.0644),
            capacity: 200,
            hourlyRate: "$2.00"
        },
        {
            name: "Bow Valley College",
            location: L.latLng(51.0470, -114.0555),
            capacity: 300,
            hourlyRate: "$4.00"
        }
    ];
    
    // Loop through each parking zone and add it to the map
    parkingZones.forEach(zone => {
        // Create a circle for the parking zone
        const parkingCircle = L.circle(zone.location, {
            color: '#FF8C00',
            fillColor: '#FFA500',
            fillOpacity: 0.5,
            radius: 50,
            className: 'parking-zone'
        }).addTo(map);
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContent.innerHTML = `
            <h3>${zone.name}</h3>
            <p>Capacity: ${zone.capacity} spots</p>
            <p>Rate: ${zone.hourlyRate}/hour</p>
            <button>Select as meeting point</button>
        `;
        
        // Add event listener to the button
        const button = popupContent.querySelector('button');
        button.addEventListener('click', function() {
            selectMeetingPoint(zone.location.lat, zone.location.lng, zone.name);
            parkingCircle.closePopup();
        });
        
        // Bind the popup to the circle
        parkingCircle.bindPopup(popupContent);
    });
    
    console.log(`Added ${parkingZones.length} parking zones to the map`);
}

// ----- SELECT MEETING POINT -----
// Handles selecting a meeting point (parking zone)

function selectMeetingPoint(lat, lng, name) {
    // Store the meeting point
    meetingPoint = L.latLng(lat, lng);
    
    // If we already have a meeting point marker, remove it
    if (meetingPointMarker) {
        map.removeLayer(meetingPointMarker);
    }
    
    // Create a marker for the meeting point
    meetingPointMarker = L.marker(meetingPoint, {
        icon: L.divIcon({
            className: 'meeting-point-marker',
            html: '<div style="background-color: #FF8C00; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [20, 20]
        })
    }).addTo(map);
    
    meetingPointMarker.bindPopup(`Meeting Point: ${name}`).openPopup();
    
    // Calculate the route
    calculateRoute(userLocation, meetingPoint);
    
    console.log(`Meeting point selected: ${name} at ${lat}, ${lng}`);
}

// ----- CALCULATE ROUTE -----
// Uses Leaflet Routing Machine to calculate a route between points

function calculateRoute(start, end) {
    console.log(`Calculating route from ${start} to ${end}`);
    
    // If we already have a route control, remove it
    if (routeControl) {
        map.removeControl(routeControl);
    }
    
    // Determine which routing profile to use based on user type
    // These are the profiles available in Leaflet Routing Machine
    const profile = userType === 'driver' ? 'driving' : 'walking';
    
    // Create a new route control
    routeControl = L.Routing.control({
        // Set the start and end points
        waypoints: [
            L.latLng(start.lat, start.lng),
            L.latLng(end.lat, end.lng)
        ],
        // Customize the route appearance
        lineOptions: {
            styles: [{
                color: userType === 'driver' ? '#3388ff' : '#32CD32',
                weight: 6,
                opacity: 0.7
            }],
            addWaypoints: false // Don't allow adding extra waypoints
        },
        // Enable/disable dragging
        routeWhileDragging: false,
        // Use OSRM backend with different profiles
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: profile // Use the profile we determined
        }),
        // Customize the display
        collapsible: true,
        fitSelectedRoutes: true,
        showAlternatives: false,
        // Custom formatter for instructions
        formatter: new L.Routing.Formatter({
            distanceTemplate: '{value} {unit}',
            timeTemplate: '{time}'
        })
    }).addTo(map);
    
    // Listen for the routesfound event to get route details
    routeControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        console.log("Route found:", routes[0]);
        
        // Calculate and store the estimated arrival time
        calculateEstimatedArrivalTime(summary.totalTime);
        
        // Update UI
        updateStatusMessage();
        
        // Display turn-by-turn directions
        displayDirections(routes[0].instructions);
    });
    
    // Listen for routing errors
    routeControl.on('routingerror', function(e) {
        console.error("Routing error:", e.error);
        
        // Show error message
        document.getElementById('status-message').textContent = 
            "Error calculating route. Creating a straight-line route instead.";
        
        // Create a fallback route
        createFallbackRoute(start, end, profile);
    });
    
    // Hide the default Leaflet Routing Machine control panel
    // We'll use our own custom directions panel
    setTimeout(function() {
        const controlContainer = document.querySelector('.leaflet-routing-container');
        if (controlContainer) {
            controlContainer.style.display = 'none';
        }
    }, 100);
}

// ----- CREATE FALLBACK ROUTE -----
// Creates a simple straight-line route when routing fails

function createFallbackRoute(start, end, profile) {
    console.log("Creating fallback route");
    
    // Create a straight line between the points
    const routeLine = L.polyline([
        [start.lat, start.lng],
        [end.lat, end.lng]
    ], {
        color: userType === 'driver' ? '#3388ff' : '#32CD32',
        weight: 6,
        opacity: 0.7,
        dashArray: '10, 10' // Make it dashed to indicate it's an approximate route
    }).addTo(map);
    
    // Zoom to fit the route
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    
    // Calculate distance in kilometers
    const distance = start.distanceTo(end) / 1000;
    
    // Estimate time based on user type (driver vs. walker)
    const speed = profile === 'driving' ? 30 : 5; // km/h
    const timeInSeconds = (distance / speed) * 3600;
    
    // Calculate ETA
    calculateEstimatedArrivalTime(timeInSeconds);
    
    // Update status message
    updateStatusMessage();
    
    // Create simple directions
    const instructions = [
        {
            type: "Head",
            text: "Start at your location",
            distance: 0,
            time: 0
        },
        {
            type: "WayPoint",
            text: profile === 'driving' ? 
                "Drive to the destination" : 
                "Walk to the destination",
            distance: Math.round(distance * 1000), // meters
            time: Math.round(timeInSeconds) // seconds
        },
        {
            type: "DestinationReached",
            text: "You have arrived at your destination",
            distance: 0,
            time: 0
        }
    ];
    
    // Display directions
    displayDirections(instructions);
}

// ----- CALCULATE ETA -----
// Calculates the estimated arrival time based on route duration

function calculateEstimatedArrivalTime(durationInSeconds) {
    // Get current date/time
    const now = new Date();
    
    // Add the duration (in seconds) to the current time
    const arrivalTime = new Date(now.getTime() + (durationInSeconds * 1000));
    
    // Format the arrival time
    const hours = arrivalTime.getHours();
    const minutes = arrivalTime.getMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    // Format the time with leading zeros for minutes
    const formattedTime = `${hours12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    
    // Calculate travel time in minutes
    const travelMinutes = Math.round(durationInSeconds / 60);
    
    // Store the ETA with travel duration
    estimatedArrivalTime = `${formattedTime} (${travelMinutes} min)`;
    
    console.log(`Estimated arrival: ${estimatedArrivalTime}`);
    
    return estimatedArrivalTime;
}

// ----- DISPLAY DIRECTIONS -----
// Shows turn-by-turn navigation instructions in the sidebar

function displayDirections(instructions) {
    const directionsContainer = document.getElementById('directions-container');
    
    // Create HTML for the directions panel
    let html = '<div class="directions-container">';
    
    // Add ETA information at the top
    if (estimatedArrivalTime) {
        html += `<div class="eta-info">
            <h4>Estimated Arrival</h4>
            <div class="eta-time">${estimatedArrivalTime}</div>
        </div>`;
    }
    
    html += '<h4>Turn-by-Turn Directions</h4>';
    html += '<ul class="directions-list">';
    
    // Add each step in the route
    instructions.forEach(instruction => {
        // Get the text and distance from the instruction
        const text = instruction.text;
        
        // Leaflet Routing Machine provides distance in meters
        const distance = (instruction.distance / 1000).toFixed(2); // Convert to km
        
        // Convert seconds to minutes
        const duration = Math.round(instruction.time / 60);
        
        // Get appropriate icon based on direction type
        const icon = getDirectionIcon(instruction.type);
        
        html += `
            <li class="direction-step">
                <div class="direction-icon">
                    ${icon}
                </div>
                <div class="direction-text">
                    <span class="instruction">${text}</span>
                    <span class="distance">${distance} km • ${duration} min</span>
                </div>
            </li>
        `;
    });
    
    html += '</ul></div>';
    
    // Update the directions container
    directionsContainer.innerHTML = html;
    
    console.log(`Displayed ${instructions.length} navigation steps with ETA: ${estimatedArrivalTime}`);
}

// ----- GET DIRECTION ICON -----
// Returns an appropriate icon for each direction type

function getDirectionIcon(type) {
    // Map instruction types to appropriate symbols
    // Leaflet Routing Machine uses different types than OpenRouteService
    
    switch(type) {
        case "Head":
        case "Continue":
            return '↑';
        case "SlightRight":
            return '↗';
        case "Right":
            return '→';
        case "SharpRight":
            return '↘';
        case "TurnAround":
            return '↓';
        case "SharpLeft":
            return '↙';
        case "Left":
            return '←';
        case "SlightLeft":
            return '↖';
        case "WayPoint":
        case "DestinationReached":
            return '🏁';
        case "Roundabout":
            return '⭕';
        default:
            return '•';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initApp); 