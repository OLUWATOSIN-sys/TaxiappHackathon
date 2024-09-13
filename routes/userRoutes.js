const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Web3 = require('web3');
const { newKitFromWeb3 } = require('@celo/contractkit');

const router = express.Router();

// Connect to Celo Testnet (Alfajores) or Mainnet based on your environment
const web3 = new Web3('https://alfajores-forno.celo-testnet.org');  // Use Mainnet URL for production
const kit = newKitFromWeb3(web3);

// User signup
router.post('/signup', async (req, res) => {
    const { email, password, celoWallet } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({ email, password: hashedPassword, celoWallet });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'User registration failed' });
    }
});

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send back token and user id
        res.status(200).json({
            message: 'Login successful',
            redirectUrl: '/user-dashboard',  // Redirecting to user dashboard
            token,
            userId: user.id,  // Make sure to return the userId here
            celoWallet: user.celoWallet
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});



// Fetch Celo balance for the user
router.post('/balance', async (req, res) => {
    const { address } = req.body;

    if (!address) {
        return res.status(400).json({ error: 'Celo wallet address not provided' });
    }

    try {
        // Fetch the balance from Celo blockchain
        const balance = await kit.web3.eth.getBalance(address);
        const celoBalance = web3.utils.fromWei(balance, 'ether');
        res.json({ balance: celoBalance });
    } catch (error) {
        console.error('Error fetching Celo balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

module.exports = router;
