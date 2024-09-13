// Retrieve ride details from localStorage and display them
const rideDetails = JSON.parse(localStorage.getItem('rideDetails'));

if (rideDetails) {
    document.getElementById('pickup-address').textContent = rideDetails.pickupAddress;
    document.getElementById('dropoff-address').textContent = rideDetails.dropoffAddress;
    document.getElementById('ride-distance').textContent = `${rideDetails.distance} km`;
    document.getElementById('ride-fare').textContent = `$${rideDetails.fare}`;
}

// Fetch available drivers and display them in the list
async function fetchAvailableDrivers() {
    try {
        const response = await fetch('/rides/available-drivers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Ensure JWT token exists in localStorage
            }
        });

        const drivers = await response.json();
        const driverList = document.getElementById('driver-list');
        driverList.innerHTML = '';  // Clear any previous list items

        drivers.forEach(driver => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `Driver: ${driver.fullName}, Country: ${driver.country}`;
            li.addEventListener('click', () => {
                localStorage.setItem('selectedDriver', driver.id);  // Store selected driver ID
                document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));
                li.classList.add('active');  // Highlight selected driver
            });
            driverList.appendChild(li);
        });

    } catch (error) {
        console.error('Error fetching drivers:', error);
        alert('Error fetching drivers.');
    }
}

fetchAvailableDrivers();

// Confirm ride when the user clicks the "Confirm Ride" button
document.getElementById('confirm-ride').addEventListener('click', async () => {
    const selectedDriver = localStorage.getItem('selectedDriver');
    const pickupLocation = rideDetails.pickupAddress;
    const dropoffLocation = rideDetails.dropoffAddress;
    const distance = rideDetails.distance;
    const offerAmount = document.getElementById('offer-amount').value;

    if (!selectedDriver) {
        alert('Please select a driver.');
        return;
    }

    if (!offerAmount || parseFloat(offerAmount) <= 0) {
        alert('Please enter a valid offer amount.');
        return;
    }

    try {
        // Show loader while waiting for the driver
        document.getElementById('loader').style.display = 'block';
        document.getElementById('response-message').textContent = '';

        // Send ride request to the backend with selected driver and offer
        const response = await fetch('/rides/request-ride', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Pass the JWT token
            },
            body: JSON.stringify({
                userId: localStorage.getItem('userId'),  // Ensure userId is stored after login
                pickupLocation,
                dropoffLocation,
                distance: parseFloat(distance),
                offerAmount: parseFloat(offerAmount),  // Send offer amount to driver
                driverId: selectedDriver  // Send the selected driver's ID
            })
        });

        if (response.ok) {
            const result = await response.json();
            waitForDriverResponse(result.rideId);
        } else {
            document.getElementById('loader').style.display = 'none';
            const errorData = await response.json();
            alert(errorData.error || 'Error requesting ride.');
        }
    } catch (error) {
        console.error('Error confirming ride:', error);
        alert('An error occurred while confirming the ride.');
    }
});

// Function to simulate waiting for driver response (accept/decline)
async function waitForDriverResponse(rideId) {
    let isWaiting = true;
    while (isWaiting) {
        try {
            const response = await fetch(`/rides/check-driver-response/${rideId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'accepted') {
                    document.getElementById('loader').style.display = 'none';
                    document.getElementById('response-message').textContent = 'Driver accepted the ride!';
                    isWaiting = false;
                } else if (data.status === 'declined') {
                    document.getElementById('loader').style.display = 'none';
                    document.getElementById('response-message').textContent = 'Driver declined the ride. Please choose another driver.';
                    isWaiting = false;
                }
            }

            // Wait for a few seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error('Error waiting for driver response:', error);
        }
    }
}
