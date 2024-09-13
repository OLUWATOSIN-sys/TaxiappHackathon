const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import your configured Sequelize instance
const Driver = require('./Driver'); // Assuming you have a Driver model
const User = require('./User');     // Assuming you have a User model

const RideRequest = sequelize.define('RideRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Make sure this matches your actual user model table name
            key: 'id'
        }
    },
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Initially null if no driver is assigned
        references: {
            model: 'Drivers', // Make sure this matches your actual driver model table name
            key: 'id'
        }
    },
    pickupLocation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dropoffLocation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    distance: {
        type: DataTypes.FLOAT, // Distance in kilometers (or miles if needed)
        allowNull: false
    },
    fare: {
        type: DataTypes.FLOAT, // Calculated fare for the ride
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'completed', 'canceled'),
        allowNull: false,
        defaultValue: 'pending' // When the ride is first requested
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Associate RideRequest with Driver and User models
RideRequest.belongsTo(Driver, { foreignKey: 'driverId' });
RideRequest.belongsTo(User, { foreignKey: 'userId' });

module.exports = RideRequest;
