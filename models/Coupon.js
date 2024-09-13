const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Ensure this path is correct

const Coupon = sequelize.define('Coupon', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = Coupon;
