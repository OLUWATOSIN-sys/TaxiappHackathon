// helpers.js

const axios = require('axios');

// Example of fetching Celo balance
async function getCeloBalance(walletAddress) {
    try {
        // Integrate with Celo blockchain to get balance
        // Example: Replace this with actual Celo integration
        const response = await axios.get(`https://celo-api.com/balance/${walletAddress}`);
        return response.data.balance;
    } catch (error) {
        console.error('Error fetching Celo balance:', error);
        return 0;
    }
}

// Notify admin about new withdrawal request
async function notifyAdminNewWithdrawal(driverName, amount) {
    console.log(`Admin notified: ${driverName} requested to withdraw ${amount} CELO`);
    // Further code for real-time notifications
}

// Notify driver status change
async function notifyDriverStatusChange(driverName, onlineStatus) {
    console.log(`${driverName} is now ${onlineStatus ? 'online' : 'offline'}`);
    // Further code for real-time notifications
}

module.exports = {
    getCeloBalance,
    notifyAdminNewWithdrawal,
    notifyDriverStatusChange
};
