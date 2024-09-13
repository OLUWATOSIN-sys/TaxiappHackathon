const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Path to your sequelize instance

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    celoWallet: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, { timestamps: true });

module.exports = User;
