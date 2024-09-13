const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // The token is in the format "Bearer <token>"

        jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }

            req.user = user; // Attach the decoded token to req.user
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        return res.status(401).json({ message: 'Authorization header missing' });
    }
}

module.exports = authenticateJWT;
