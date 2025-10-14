const jwt = require('jsonwebtoken');

// This middleware function acts as a gatekeeper for protected routes
module.exports = function (req, res, next) {
    // Get token from the request header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach the user's ID to the request object for later use
        req.user = decoded.user;
        next(); // If token is valid, proceed to the next step (the route handler)
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};