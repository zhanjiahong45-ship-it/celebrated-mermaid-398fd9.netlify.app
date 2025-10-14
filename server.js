// File: back/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS FIX: START ---
// Define allowed origins
const allowedOrigins = [
    'http://localhost:3000', // For your local development
    'https://celebrated-mermaid-398fd9.netlify.app' // Your deployed frontend URL
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions)); // Use the configured CORS options
// --- CORS FIX: END ---


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