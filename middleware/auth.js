// File: back/middleware/auth.js (DEBUGGING VERSION)
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // --- Diagnostic Log ---
    // Let's see what the middleware is actually using as its secret key.
    console.log('\n--- AUTH MIDDLEWARE TRIGGERED ---');
    console.log('Token received:', token);
    console.log('Secret Key being used for verification:', process.env.JWT_SECRET);
    // --------------------

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        console.log('--- TOKEN VERIFICATION SUCCESSFUL ---');
        next();
    } catch (err) {
        // --- This is where your error is coming from ---
        console.error('💥💥💥 TOKEN VERIFICATION FAILED! 💥💥💥');
        console.error('The error was:', err.message);
        // ---------------------------------------------
        res.status(401).json({ msg: 'Token is not valid' });
    }
};