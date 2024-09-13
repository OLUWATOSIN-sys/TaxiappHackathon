const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you have a config file for your database connection

const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'drivers', // References the 'drivers' table
            key: 'id',
        },
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending', // Can be 'pending', 'approved', 'rejected'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'withdrawal_requests',
});

module.exports = WithdrawalRequest;
