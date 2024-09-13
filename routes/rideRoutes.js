const express = require('express');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { newKitFromWeb3 } = require('@celo/contractkit');
const Web3 = require('web3');
const convertCeloToZAR = require('../config/currencyConversion');
const dotenv = require('dotenv');

// Load environment variables from the .env file
dotenv.config();

// Ensure CELO_RPC is defined
if (!process.env.CELO_RPC) {
    throw new Error("CELO_RPC is not defined in the .env file");
}

// Initialize Web3 with the Celo RPC from the .env
const web3 = new Web3(process.env.CELO_RPC);

// Ensure that Web3 provider is valid
if (!web3.currentProvider) {
    throw new Error("Invalid Web3 provider. Check the CELO_RPC in your .env file.");
}

// Initialize Celo ContractKit
const kit = newKitFromWeb3(web3);

// Add the account using the private key from the .env
if (!process.env.CELO_PRIVATE_KEY) {
    throw new Error("CELO_PRIVATE_KEY is not defined in the .env file");
}
const account = web3.eth.accounts.privateKeyToAccount(process.env.CELO_PRIVATE_KEY);
kit.connection.addAccount(account.privateKey);

const router = express.Router();

// Helper function to calculate fare (could be based on distance or dynamic pricing)
function calculateFare(distance) {
    const baseFare = 1; // In Celo
    const farePerKm = 0.2; // Celo per km
    return baseFare + distance * farePerKm;
}

// Helper function to calculate the distance (this could come from the frontend via Google Maps API)
function calculateDistance(pickupLocation, dropoffLocation) {
    // Placeholder logic; In reality, you would use a service like Google Maps API
    return Math.random() * 10; // Mock random distance (10km max)
}

// Fetch available drivers (who are online)
router.get('/available-drivers', async (req, res) => {
    try {
        const drivers = await Driver.findAll({ where: { online: true, approved: true } });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching drivers' });
    }
});

router.post('/request-ride', async (req, res) => {
    const { pickupLocation, dropoffLocation, userId, distance } = req.body;
    const driverId = req.query.driverId;  // Retrieve driverId from query params
    
    try {
        const driver = await Driver.findByPk(driverId);
        if (!driver || !driver.online) {
            return res.status(400).json({ error: 'Selected driver is not available' });
        }

        // Create the ride request and associate it with the driver and user
        const newRide = await Ride.create({
            userId,
            driverId,
            pickupLocation,
            dropoffLocation,
            distance,
            status: 'pending'  // Ensure the status is set to pending for retrieval later
        });

        res.json({ message: 'Ride requested successfully', ride: newRide });
    } catch (error) {
        console.error('Error requesting ride:', error);
        res.status(500).json({ error: 'Error requesting ride' });
    }
});




// Driver accepts ride and starts the trip
router.post('/accept-ride', async (req, res) => {
    const { rideId, driverId } = req.body;

    try {
        const ride = await Ride.findOne({ where: { id: rideId, driverId, status: 'pending' } });
        if (!ride) {
            return res.status(400).json({ error: 'Ride not found or already accepted' });
        }

        ride.status = 'accepted';
        await ride.save();

        res.json({ message: 'Ride accepted', ride });
    } catch (error) {
        res.status(500).json({ error: 'Error accepting ride' });
    }
});

// Driver starts the trip
router.post('/start-trip', async (req, res) => {
    const { rideId, driverId } = req.body;

    try {
        const ride = await Ride.findOne({ where: { id: rideId, driverId, status: 'accepted' } });
        if (!ride) {
            return res.status(400).json({ error: 'Ride not found or cannot start' });
        }

        ride.status = 'in_progress';
        await ride.save();

        res.json({ message: 'Trip started', ride });
    } catch (error) {
        res.status(500).json({ error: 'Error starting trip' });
    }
});

// Complete the trip and pay the driver
router.post('/complete-trip', async (req, res) => {
    const { rideId } = req.body;

    try {
        const ride = await Ride.findOne({ where: { id: rideId, status: 'in_progress' } });
        if (!ride) {
            return res.status(400).json({ error: 'Ride not found or cannot complete' });
        }

        // Complete the ride
        ride.status = 'completed';
        await ride.save();

        // Find the driver and calculate payment
        const driver = await Driver.findByPk(ride.driverId);
        if (!driver) {
            return res.status(400).json({ error: 'Driver not found' });
        }

        // Convert fare in Celo to ZAR based on driver's country
        const fareInZAR = await convertCeloToZAR(ride.fareInCelo, driver.country);
        if (!fareInZAR) {
            return res.status(500).json({ error: 'Error converting fare to ZAR' });
        }

        // Transfer payment in cUSD (Celo's stablecoin)
        const cUSDContract = await kit.contracts.getStableToken();
        const amountInWei = web3.utils.toWei(ride.fareInCelo.toString(), 'ether');
        const tx = await cUSDContract.transfer(driver.celoWallet, amountInWei).send({ from: account.address });
        await tx.waitReceipt();

        res.json({ message: 'Trip completed and payment successful', fareInZAR });
    } catch (error) {
        res.status(500).json({ error: 'Error completing trip and processing payment' });
    }
});

module.exports = router;
