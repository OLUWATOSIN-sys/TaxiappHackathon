const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Correctly importing Sequelize instance from config
const User = require('./User');
const Driver = require('./Driver');

const Ride = sequelize.define('Ride', {
    pickupLocation: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dropoffLocation: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
    },
});

// Ride belongs to User and Driver
Ride.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Ride.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

module.exports = Ride;
