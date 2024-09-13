const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');  // Sequelize instance
const User = require('./models/User');  // Ensure User model exists
const Driver = require('./models/Driver');  // Ensure Driver model exists
const RideRequest = require('./models/RideRequest'); // Ensure RideRequest model exists

// Swagger imports
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const rideRoutes = require('./routes/rideRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0', // Use OpenAPI version
    info: {
      title: 'Taxi App API',
      version: '1.0.0',
      description: 'API documentation for the Taxi app',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Change this to your server URL
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Use routes
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes); // Driver routes
app.use('/admin', adminRoutes);
app.use('/rides', rideRoutes);

// Serve the main index.html file without ".html" in URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/driver-signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'driver-signup.html'));
});

app.get('/driver-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'driver-login.html'));
});

app.get('/rideconfirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rideconfirmation.html'));
});

// User dashboard
app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'user-dashboard.html'));
});

// Driver dashboard
app.get('/driver-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'driver-dashboard.html'));
});

// Admin dashboard
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'admin-dashboard.html'));
});

// Sync the database and create tables if they don't exist
sequelize.sync({ force: false })  // Use force: true to recreate tables (use with caution)
    .then(() => {
        console.log('Database synced successfully');
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
