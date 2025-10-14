// File: back/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Upgraded Mock Database ---
let database = {
    totalPoints: 0,
    streak: 0, // Tracks consecutive days
    lastCheckinDate: null, // Tracks the last check-in
    focusHabitId: 1, // The daily featured habit
    contribution: { co2SavedKg: 0, waterSavedLiters: 0 },
    tree: { level: 1, currentXp: 0, xpToNextLevel: 100 },
    habits: [ // Core, non-custom habits
        { id: 1, name: "Use own cup/bag", checked: false, points: 10, contributionType: 'co2', value: 0.1 },
        { id: 2, name: "Sort waste", checked: false, points: 15, contributionType: 'co2', value: 0.2 },
        { id: 3, name: "Save water (shorter shower)", checked: false, points: 10, contributionType: 'water', value: 5 },
        { id: 4, name: "Use public transport", checked: false, points: 20, contributionType: 'co2', value: 0.15 }
    ]
};

// --- Smart Logic: Daily Reset ---
const resetDailyDataIfNeeded = () => {
    const today = new Date().toDateString();
    if (database.lastCheckinDate !== today) {
        // Reset all habit check-in states
        database.habits.forEach(h => h.checked = false);
        // Pick a new random focus from the core habits
        const coreHabits = database.habits.filter(h => h.id <= 4);
        database.focusHabitId = coreHabits[Math.floor(Math.random() * coreHabits.length)].id;
        console.log(`New day! Habits reset. Focus ID: ${database.focusHabitId}`);
    }
};

// API: Get all data
app.get('/api/data', (req, res) => {
    resetDailyDataIfNeeded(); // Check for reset on every data fetch
    res.json(database);
});

// API: Add a custom habit
app.post('/api/habits/add', (req, res) => {
    const { name, points } = req.body;
    if (!name || !points) {
        return res.status(400).json({ message: "Name and points are required." });
    }
    const newHabit = {
        id: Date.now(), // Use timestamp for a unique ID
        name: name,
        checked: false,
        points: parseInt(points, 10),
        isCustom: true // Flag as a custom habit
    };
    database.habits.push(newHabit);
    res.status(201).json(database.habits);
});

// API: Handle check-in requests (Upgraded)
app.post('/api/checkin', (req, res) => {
    resetDailyDataIfNeeded();
    const { habitId, distance } = req.body;
    const habit = database.habits.find(h => h.id === habitId);

    if (habit && !habit.checked) {
        habit.checked = true;
        let pointsEarned = habit.points;

        // Double points for the focus habit
        if (habit.id === database.focusHabitId) {
            pointsEarned *= 2;
        }

        database.totalPoints += pointsEarned;
        database.tree.currentXp += pointsEarned;

        // Level up logic
        if (database.tree.currentXp >= database.tree.xpToNextLevel) {
            database.tree.level += 1;
            database.tree.currentXp -= database.tree.xpToNextLevel;
            database.tree.xpToNextLevel *= 1.5;
        }

        // Streak logic
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (database.lastCheckinDate === yesterday.toDateString()) {
            database.streak += 1; // It's a combo
        } else if (database.lastCheckinDate !== today.toDateString()) {
            database.streak = 1; // First check-in of a new streak
        }
        database.lastCheckinDate = today.toDateString();

        // Contribution calculation (logic unchanged)
        if (habit.id === 4 && distance) {
            database.contribution.co2SavedKg += distance * habit.value;
        } else if (habit.contributionType === 'co2') {
            database.contribution.co2SavedKg += habit.value;
        } else if (habit.contributionType === 'water') {
            database.contribution.waterSavedLiters += habit.value;
        }
        
        res.status(200).json({
            message: `Earned ${pointsEarned} points!`,
            updatedHabit: habit,
            totalPoints: database.totalPoints,
            contribution: database.contribution,
            tree: database.tree,
            streak: database.streak
        });
    } else if (habit && habit.checked) {
        res.status(400).json({ message: "Already checked in today!" });
    } else {
        res.status(404).json({ message: "Habit not found" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});