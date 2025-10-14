// File: back/routes/data.js (DEBUGGING VERSION)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// This function remains the same, but we will log its inputs
const resetDailyDataIfNeeded = (user) => {
    // --- Diagnostic Log ---
    console.log('--- 3. Entering resetDailyDataIfNeeded function ---');
    console.log('User data being passed to reset function:', JSON.stringify(user.data, null, 2));
    // --------------------

    const today = new Date().toDateString();
    if (user.data.lastCheckinDate !== today) {
        if (user.data.habits && user.data.habits.length > 0) {
            user.data.habits.forEach(h => h.checked = false);
            const coreHabits = user.data.habits.filter(h => h.id <= 4);
            if (coreHabits && coreHabits.length > 0) {
                user.data.focusHabitId = coreHabits[Math.floor(Math.random() * coreHabits.length)].id;
            } else {
                user.data.focusHabitId = 1;
            }
        }
        console.log(`New day for user ${user.username}! Habits reset.`);
    }
};

// @route   GET api/data
router.get('/', auth, async (req, res) => {
    // --- Diagnostic Log ---
    console.log('\n--- 1. GET /api/data route was hit ---');
    console.log(`Request is for user ID: ${req.user.id}`);
    // --------------------
    
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        // --- Diagnostic Log ---
        console.log('--- 2. Successfully fetched user from database ---');
        console.log('User object from DB:', JSON.stringify(user, null, 2));
        // --------------------

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        resetDailyDataIfNeeded(user);
        
        // --- Diagnostic Log ---
        console.log('--- 4. Successfully ran resetDailyDataIfNeeded ---');
        // --------------------
        
        await user.save();

        // --- Diagnostic Log ---
        console.log('--- 5. Successfully saved user back to database ---');
        // --------------------

        res.json(user.data);

    } catch (err) {
        // --- THIS IS THE MOST IMPORTANT LOG ---
        console.error('💥💥💥 FATAL ERROR in GET /api/data! 💥💥💥');
        console.error(err); // Log the full error object
        // ------------------------------------
        res.status(500).send('Server Error');
    }
});

// The rest of the routes remain the same for now
router.post('/checkin', auth, async (req, res) => {
    // ... (checkin logic)
    res.status(200).json({ message: "Check-in logic placeholder" });
});

router.post('/habits/add', auth, async (req, res) => {
    // ... (add habit logic)
    res.status(200).json({ message: "Add habit logic placeholder" });
});

module.exports = router;