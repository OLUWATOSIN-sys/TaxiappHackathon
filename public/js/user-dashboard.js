let map, directionsService, directionsRenderer;
let pickupMarker, dropoffMarker;

// Function to initialize the Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -33.9249, lng: 18.4241 },  // Cape Town, South Africa
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Request user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Center the map at the user's location
            map.setCenter(userLocation);
            map.setZoom(14);

            // Place a marker at the user's current location
            if (pickupMarker) pickupMarker.setMap(null);  // Remove old marker
            pickupMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location"
            });
        }, () => {
            alert('Geolocation service failed.');
        });
    } else {
        alert('Your browser does not support geolocation.');
    }
}

// Function to calculate distance and fare
document.getElementById('calculate-fare').addEventListener('click', () => {
    const pickupAddress = document.getElementById('pickup').value;
    const dropoffAddress = document.getElementById('dropoff').value;

    if (!pickupAddress || !dropoffAddress) {
        alert('Please enter both pickup and dropoff addresses.');
        return;
    }

    // Request route between pickup and dropoff
    const request = {
        origin: pickupAddress,
        destination: dropoffAddress,
        travelMode: 'DRIVING'
    };

    directionsService.route(request, function (result, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const distanceInKm = result.routes[0].legs[0].distance.value / 1000;  // Distance in kilometers
            document.getElementById('distance-info').textContent = `${distanceInKm} km`;

            // Assume a base fare and calculate based on distance
            const baseFare = 5;  // Base fare in dollars
            const costPerKm = 2;  // Cost per kilometer in dollars
            const fare = baseFare + (costPerKm * distanceInKm);
            document.getElementById('fare-info').textContent = `Estimated Fare: $${fare.toFixed(2)}`;

            // Check user's Celo balance
            const celoBalance = parseFloat(document.getElementById('celo-balance').textContent);
            if (celoBalance < fare) {
                alert('Insufficient CELO balance to request this ride.');
                return; // Stop if the balance is insufficient
            }

            // Populate the modal with trip details
            document.getElementById('modal-pickup').textContent = pickupAddress;
            document.getElementById('modal-dropoff').textContent = dropoffAddress;
            document.getElementById('modal-distance').textContent = `${distanceInKm} km`;
            document.getElementById('modal-fare').textContent = `$${fare.toFixed(2)}`;

            // Open the custom modal
            openModal('customModal');

            // Fetch drivers and display in the modal
            fetchAvailableDrivers();
        } else {
            alert('Error calculating route: ' + status);
        }
    });
});

// Open the custom modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Function to fetch available drivers
async function fetchAvailableDrivers() {
    try {
        const response = await fetch('/drivers/available-drivers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Ensure JWT token exists in localStorage
            }
        });

        const drivers = await response.json();
        const driverList = document.getElementById('driver-list');
        driverList.innerHTML = '';  // Clear any previous list items

        if (drivers.length === 0) {
            const noDriverMessage = document.createElement('li');
            noDriverMessage.className = 'list-group-item text-danger';
            noDriverMessage.textContent = 'No drivers available at the moment.';
            driverList.appendChild(noDriverMessage);
        } else {
            drivers.forEach(driver => {
                const li = document.createElement('li');
                li.className = 'list-group-item driver-item';  // Add a specific class to identify the driver item
                li.textContent = `Driver: ${driver.fullName}, Car: ${driver.carName}, Plate: ${driver.plateNumber}`;
                li.setAttribute('data-driver-id', driver.id);  // Store driver id as an attribute

                // Add click event for selecting and unselecting driver
                li.addEventListener('click', () => {
                    // Remove 'active' class from other items and add it to the selected one
                    document.querySelectorAll('.driver-item').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');

                    // Enable the confirm button
                    document.getElementById('confirm-driver').disabled = false;

                    // Store selected driver ID in localStorage
                    localStorage.setItem('selectedDriver', driver.id);
                });

                driverList.appendChild(li);
            });
        }

    } catch (error) {
        console.error('Error fetching drivers:', error);
        alert('Error fetching drivers.');
    }
}

document.getElementById('confirm-driver').addEventListener('click', async () => {
    const selectedDriver = localStorage.getItem('selectedDriver');
    const pickupLocation = document.getElementById('pickup').value;
    const dropoffLocation = document.getElementById('dropoff').value;
    const distance = document.getElementById('distance-info').textContent.replace(' km', '');

    const userId = localStorage.getItem('userId'); // Ensure userId is available in localStorage

    if (!selectedDriver) {
        alert('Please select a driver.');
        return;
    }

    try {
       
        const selectedDriver = localStorage.getItem('selectedDriver'); // Assuming driver ID is stored in localStorage

const response = await fetch(`/rides/request-ride?driverId=${selectedDriver}`, {  // Adding driverId as query param
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`  // Pass the JWT token
    },
    body: JSON.stringify({
        userId: localStorage.getItem('userId'),  // Ensure userId is being sent
        pickupLocation,
        dropoffLocation,
        distance: parseFloat(distance),
    })
});

        

        if (response.ok) {
            openModal('loaderModal');  // Show loader while waiting for driver acceptance
        } else {
            const result = await response.json();
            alert(result.error || 'Error requesting ride.');
        }
    } catch (error) {
        console.error('Error confirming ride:', error);
        alert('An error occurred while confirming the ride.');
    }
});

// Function to close the modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Function to fetch the user's actual Celo balance
async function fetchCeloBalance() {
    const celoWallet = localStorage.getItem('celoWallet');
    if (!celoWallet) {
        alert("Celo wallet address not found.");
        return;
    }

    try {
        const response = await fetch('/users/balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address: celoWallet })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('celo-balance').textContent = data.balance;
        } else {
            console.error('Error fetching balance:', data.error);
            alert('Error fetching Celo balance.');
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        alert('Error fetching Celo balance.');
    }
}

// Simulate fetching the balance and initializing the map on window load
window.onload = function() {
    fetchCeloBalance();
    initMap();
};
