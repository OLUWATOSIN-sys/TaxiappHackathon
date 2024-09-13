
const express = require('express');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride'); // Update this path based on your project structure
const RideRequest = require('../models/RideRequest');
const WithdrawalRequest = require('../models/WithdrawalRequest'); // Ensure WithdrawalRequest model exists
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getCeloBalance, notifyAdminNewWithdrawal, notifyDriverStatusChange } = require('./helpers'); // Ensure you have the helper functions set up properly
const authenticateJWT = require('../middleware/authenticateJWT'); // Correct the path if needed

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { fullName, email, password, celoWallet, country, carName, plateNumber } = req.body;

    try {
        const existingDriver = await Driver.findOne({ where: { email } });
        if (existingDriver) {
            return res.status(400).json({ error: 'Driver already exists with this email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDriver = await Driver.create({
            fullName,
            email,
            password: hashedPassword,
            celoWallet,
            country,
            carName,
            plateNumber,
            online: false, // Driver initially offline
            approved: false // Admin approval required
        });

        const token = jwt.sign({ driverId: newDriver.id }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1h' });

        res.status(201).json({ message: 'Driver registered successfully', token, driverId: newDriver.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering driver.' });
    }
});

// Driver login route
// Driver login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const driver = await Driver.findOne({ where: { email } });
        if (!driver || !(await bcrypt.compare(password, driver.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { driverId: driver.id },
            process.env.JWT_SECRET || 'default_jwt_secret',
            { expiresIn: '1h' }
        );

        // Send driver info along with the token
        res.status(200).json({
            message: 'Login successful',
            token,
            driverId: driver.id,
            fullName: driver.fullName,
            celoWallet: driver.celoWallet,
            carName: driver.carName,
            plateNumber: driver.plateNumber,
            country: driver.country,
            
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});



router.get('/info', authenticateJWT, async (req, res) => {
    const { driverId } = req.user;

    try {
        const driver = await Driver.findByPk(driverId);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.status(200).json({
            fullName: driver.fullName,
            celoWallet: driver.celoWallet,
            balance: await getCeloBalance(driver.celoWallet),
            carName: driver.carName,
            plateNumber: driver.plateNumber,
            country: driver.country,
            online: driver.online  // Return online status
        });
    } catch (error) {
        console.error('Error fetching driver info:', error);
        res.status(500).json({ error: 'Failed to fetch driver info' });
    }
});



// View ride requests for driver
router.get('/view-requests', async (req, res) => {
    const { driverId } = req.query;

    // Check if driverId is provided
    if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }

    try {
        // Find all ride requests for the specified driver where status is 'pending'
        const rideRequests = await Ride.findAll({
            where: {
                driverId: driverId,
                status: 'pending'
            }
        });

        if (rideRequests.length === 0) {
            return res.status(200).json([]);  // No pending ride requests
        }

        res.status(200).json(rideRequests);
    } catch (error) {
        console.error('Error fetching ride requests:', error);
        res.status(500).json({ error: 'Failed to retrieve ride requests' });
    }
});



router.post('/toggle-availability', authenticateJWT, async (req, res) => {
    const { driverId } = req.user;
    const { online } = req.body;

    try {
        const driver = await Driver.findByPk(driverId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Update the driver's online status
        driver.online = online;
        await driver.save();

        res.status(200).json({ message: `Driver is now ${online ? 'online' : 'offline'}` });
    } catch (error) {
        console.error('Error toggling availability:', error);
        res.status(500).json({ error: 'Failed to toggle availability' });
    }
});




// View completed rides for driver
router.get('/completed-rides', async (req, res) => {
    const { driverId } = req.query;

    try {
        const completedRides = await RideRequest.findAll({ where: { driverId, status: 'completed' } });
        res.status(200).json(completedRides);
    } catch (error) {
        console.error('Error fetching completed rides:', error);
        res.status(500).json({ error: 'Failed to retrieve completed rides' });
    }
});

// Get online drivers
router.get('/available-drivers', async (req, res) => {
    try {
        const onlineDrivers = await Driver.findAll({
            where: { online: true },
            attributes: ['id', 'fullName', 'carName', 'plateNumber']
        });

        res.status(200).json(onlineDrivers);
    } catch (error) {
        console.error('Error fetching online drivers:', error);
        res.status(500).json({ error: 'Failed to retrieve online drivers' });
    }
});

// Driver withdrawal request
router.post('/withdraw', async (req, res) => {
    const { driverId, amount } = req.body;

    try {
        const driver = await Driver.findByPk(driverId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const celoBalance = await getCeloBalance(driver.celoWallet); // Fetch live Celo balance
        if (amount > celoBalance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        await WithdrawalRequest.create({ driverId, amount, status: 'pending' });
        notifyAdminNewWithdrawal(driverId, amount); // Notify admin about the withdrawal request

        res.status(200).json({ message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        res.status(500).json({ error: 'Failed to submit withdrawal request' });
    }
});

// Fetch pending withdrawals for the driver
router.get('/pending-withdrawals', async (req, res) => {
    const { driverId } = req.query;

    try {
        const withdrawals = await WithdrawalRequest.findAll({
            where: { driverId, status: 'pending' }
        });
        res.status(200).json(withdrawals);
    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        res.status(500).json({ error: 'Failed to retrieve pending withdrawals' });
    }
});

module.exports = router;