// server.js
// ... (existing imports)
const userRoutes = require('./routes/userRoutes');
const contentRoutes = require('./routes/contentRoutes'); // NEW IMPORT
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing of JSON request body
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes); // NEW ROUTE INTEGRATION

// ... (existing middleware and server start)

// Simple Welcome Route for testing
app.get('/', (req, res) => {
  res.send('LingoQuest API is running...');
});

// Define Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));