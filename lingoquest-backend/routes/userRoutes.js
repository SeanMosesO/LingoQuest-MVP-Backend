// routes/userRoutes.js
const express = require('express');
const { registerUser, authUser, getDashboardData } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// ... (existing public routes)

// Private routes (requires token)
router.route('/register').post(registerUser);
router.post('/login', authUser);
router.route('/dashboard').get(protect, getDashboardData);

module.exports = router;