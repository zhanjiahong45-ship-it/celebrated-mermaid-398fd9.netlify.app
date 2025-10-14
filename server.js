// File: back/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- THE ULTIMATE CORS FIX ---
// This configuration is the most permissive and should be placed at the very top,
// before any other middleware or routes are defined.
app.use(cors());
// --- END OF FIX ---

// Regular middleware
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
connectDB();

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data')); 

// A simple test route
app.get('/', (req, res) => res.send('API Running'));

app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));