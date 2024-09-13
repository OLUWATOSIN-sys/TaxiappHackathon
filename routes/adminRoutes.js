const express = require('express');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware for admin authentication
function adminAuth(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
}

// Approve driver
router.post('/approve-driver', adminAuth, async (req, res) => {
    const { driverId, approve } = req.body;
    try {
        if (approve) {
            await Driver.update({ approved: true }, { where: { id: driverId } });
            res.json({ message: 'Driver approved' });
        } else {
            await Driver.destroy({ where: { id: driverId } });
            res.json({ message: 'Driver rejected' });
        }
    } catch (error) {
        res.status(400).json({ error: 'Driver approval failed' });
    }
});

module.exports = router;
