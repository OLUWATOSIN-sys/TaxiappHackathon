// Google Maps API and Distance Calculation
let map, pickupMarker, dropoffMarker;
let directionsService, directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 },  // Default center
        zoom: 10,
    });

    const pickupInput = document.getElementById('pickup');
    const dropoffInput = document.getElementById('dropoff');

    const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
    const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput);

    pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        if (pickupMarker) pickupMarker.setMap(null);
        pickupMarker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: "Pickup Location"
        });
        map.setCenter(place.geometry.location);
    });

    dropoffAutocomplete.addListener('place_changed', () => {
        const place = dropoffAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        if (dropoffMarker) dropoffMarker.setMap(null);
        dropoffMarker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: "Dropoff Location"
        });
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

document.getElementById('calculate-distance')?.addEventListener('click', async () => {
    if (!pickupMarker || !dropoffMarker) {
        alert('Please select both pickup and dropoff locations.');
        return;
    }

    const request = {
        origin: pickupMarker.getPosition(),
        destination: dropoffMarker.getPosition(),
        travelMode: 'DRIVING'
    };

    directionsService.route(request, function (result, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const distance = result.routes[0].legs[0].distance.value / 1000;  // Distance in km
            document.getElementById('distance').value = `${distance} km`;
        } else {
            alert('Error calculating distance: ' + status);
        }
    });
});

// Fetch Available Drivers and Request Ride Logic
document.getElementById('request-ride')?.addEventListener('click', async () => {
    const distance = document.getElementById('distance').value;

    if (!distance) {
        alert('Please calculate the distance before requesting a ride.');
        return;
    }

    document.getElementById('loader').style.display = 'block'; // Show loader

    // Fetch available drivers from the backend
    try {
        const response = await fetch('/rides/available-drivers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Ensure JWT token exists in localStorage
            }
        });

        if (response.ok) {
            const drivers = await response.json();

            // Show drivers list
            document.getElementById('loader').style.display = 'none'; // Hide loader
            document.getElementById('available-drivers').style.display = 'block';

            const driversList = document.getElementById('drivers-list');
            driversList.innerHTML = '';  // Clear previous drivers

            // Display available drivers
            drivers.forEach(driver => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `Driver: ${driver.email}, Country: ${driver.country}`;
                li.addEventListener('click', async () => {
                    const pickupLocation = document.getElementById('pickup').value;
                    const dropoffLocation = document.getElementById('dropoff').value;

                    // Send ride request to the backend for the selected driver
                    const rideRequestResponse = await fetch('/rides/request-ride', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Pass the JWT token
                        },
                        body: JSON.stringify({
                            userId: localStorage.getItem('userId'),  // Assume userId is stored after login
                            pickupLocation,
                            dropoffLocation,
                            distance: parseFloat(distance),
                            driverId: driver.id  // Send the selected driver's ID
                        })
                    });

                    if (rideRequestResponse.ok) {
                        const rideData = await rideRequestResponse.json();
                        alert(`Ride requested successfully! Your driver is ${driver.email}.`);
                        // Optionally, redirect to another page or show the trip details
                    } else {
                        alert('Error requesting ride.');
                    }
                });

                driversList.appendChild(li);
            });
        } else {
            alert('Error fetching drivers.');
        }
    } catch (error) {
        alert('An error occurred while fetching drivers.');
        console.error(error);
    }
});

// Driver and User Login Logic
document.getElementById('driver-login')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('driver-email').value;
    const password = document.getElementById('driver-password').value;

    try {
        const response = await fetch('/drivers/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwtToken', data.token);
            window.location.href = '/driver-dashboard';  // Redirect to driver dashboard
        } else {
            alert('Driver login failed.');
        }
    } catch (error) {
        alert('An error occurred during driver login.');
        console.error(error);
    }
});

// User Login Logic
document.getElementById('user-login')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;

    try {
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('userId', data.userId);  // Store userId in localStorage
            localStorage.setItem('celoWallet', data.celoWallet);  // Store Celo wallet address
            window.location.href = '/user-dashboard';  // Redirect to user dashboard
        } else {
            alert('User login failed.');
        }
    } catch (error) {
        alert('An error occurred during user login.');
        console.error(error);
    }
});

// Fetch Celo Balance
async function fetchCeloBalance() {
    const celoWallet = localStorage.getItem('celoWallet');
    if (!celoWallet) {
        alert('Celo wallet address not found.');
        return;
    }

    try {
        const response = await fetch('/users/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: celoWallet })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('celo-balance').textContent = `${data.balance} CELO`;
        } else {
            alert('Error fetching Celo balance.');
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        alert('Error fetching Celo balance.');
    }
}

// Call fetchCeloBalance when the dashboard loads
window.onload = function() {
    fetchCeloBalance();
};
