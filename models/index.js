const sequelize = require('../config/database'); // Go up one directory to access the config folder
const RideRequest = require('./Driver'); // This path is correct assuming RideRequest.js is in the same folder

// Sync all models
sequelize.sync({ force: true }) // Set force: true if you want to recreate tables (use with caution)
    .then(() => {
        console.log('Database synced successfully');
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });
