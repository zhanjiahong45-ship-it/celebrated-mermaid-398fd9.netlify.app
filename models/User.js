const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This is the structure for each user's individual data
const UserDataSchema = new mongoose.Schema({
    totalPoints: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastCheckinDate: { type: String, default: null },
    focusHabitId: { type: Number, default: 1 },
    contribution: {
        co2SavedKg: { type: Number, default: 0 },
        waterSavedLiters: { type: Number, default: 0 },
    },
    tree: {
        level: { type: Number, default: 1 },
        currentXp: { type: Number, default: 0 },
        xpToNextLevel: { type: Number, default: 100 },
    },
    habits: { type: Array, default: [
        { id: 1, name: "Use own cup/bag", checked: false, points: 10, contributionType: 'co2', value: 0.1 },
        { id: 2, name: "Sort waste", checked: false, points: 15, contributionType: 'co2', value: 0.2 },
        { id: 3, name: "Save water (shorter shower)", checked: false, points: 10, contributionType: 'water', value: 5 },
        { id: 4, name: "Use public transport", checked: false, points: 20, contributionType: 'co2', value: 0.15 }
    ]}
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    data: { type: UserDataSchema, default: () => ({}) } // Embed the user data
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with stored hash
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);