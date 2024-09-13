const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you have a config file for your database connection

const Driver = sequelize.define('Driver', {
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    celoWallet: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    carName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    plateNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    online: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'drivers',
});

module.exports = Driver;
