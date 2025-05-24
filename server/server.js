// server/server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(express.json()); // Allows parsing of JSON request bodies
app.use(cors()); // Enables CORS for all routes

// Basic test route
app.get('/', (req, res) => {
    res.send('Online Judge Compiler Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});