// File: back/routes/data.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const resetDailyDataIfNeeded = (user) => {
    const today = new Date().toDateString();
    if (user.data.lastCheckinDate !== today) {
        if (user.data.habits && user.data.habits.length > 0) {
            user.data.habits.forEach(h => h.checked = false);
            const coreHabits = user.data.habits.filter(h => h.id <= 4);
            if (coreHabits.length > 0) {
                user.data.focusHabitId = coreHabits[Math.floor(Math.random() * coreHabits.length)].id;
            } else {
                user.data.focusHabitId = 1; 
            }
        }
    }
};

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        resetDailyDataIfNeeded(user);
        
        // --- FIX: Explicitly mark the path as modified before saving ---
        user.markModified('data');
        await user.save();

        res.json(user.data);
    } catch (err) {
        console.error('Server Error in GET /api/data:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/checkin', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { habitId, distance } = req.body;
        const habit = user.data.habits.find(h => h.id === habitId);

        if (habit && !habit.checked) {
            habit.checked = true;
            let pointsEarned = habit.points;
            if (habit.id === user.data.focusHabitId) {
                pointsEarned *= 2;
            }
            user.data.totalPoints += pointsEarned;
            user.data.tree.currentXp += pointsEarned;
            if (user.data.tree.currentXp >= user.data.tree.xpToNextLevel) {
                user.data.tree.level += 1;
                user.data.tree.currentXp -= user.data.tree.xpToNextLevel;
                user.data.tree.xpToNextLevel *= 1.5;
            }
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (user.data.lastCheckinDate === yesterday.toDateString()) {
                user.data.streak += 1;
            } else if (user.data.lastCheckinDate !== today.toDateString()){
                user.data.streak = 1;
            }
            user.data.lastCheckinDate = today.toDateString();

            if (habit.id === 4 && distance) {
                user.data.contribution.co2SavedKg += distance * habit.value;
            } else if (habit.contributionType === 'co2') {
                user.data.contribution.co2SavedKg += habit.value;
            } else if (habit.contributionType === 'water') {
                user.data.contribution.waterSavedLiters += habit.value;
            }
            
            // --- FIX: Explicitly mark the path as modified before saving ---
            user.markModified('data');
            await user.save();

            res.status(200).json({
                message: `Earned ${pointsEarned} points!`,
                data: user.data
            });
        } else {
            return res.status(400).json({ msg: 'Habit not found or already checked in' });
        }
    } catch (err) {
        console.error('Server Error in POST /api/data/checkin:', err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/habits/add', auth, async (req, res) => {
    const { name, points } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const newHabit = {
            id: Date.now(),
            name,
            points: parseInt(points, 10),
            checked: false,
            isCustom: true
        };
        user.data.habits.push(newHabit);
        
        // --- FIX: Explicitly mark the path as modified before saving ---
        user.markModified('data');
        await user.save();
        
        res.status(201).json({ 
            message: `'${name}' added successfully!`,
            data: user.data 
        });
    } catch (err) {
        console.error('Server Error in POST /api/data/habits/add:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;