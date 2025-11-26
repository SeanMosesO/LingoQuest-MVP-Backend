// routes/contentRoutes.js (adding fetch routes)
// ... (existing imports and setup)
const express = require('express');
const { createLesson, createQuiz } = require('../controllers/contentController');
const { protect, tutor } = require('../middleware/authMiddleware');
const { submitQuiz } = require('../controllers/contentController'); // Import new function
const { handleAIChat } = require('../controllers/contentController'); // Import new function

const router = express.Router();

// Route for AI Chatbot Interaction (requires authentication)
router.route('/chat').post(protect, handleAIChat);

// Routes for Tutor Portal (requires authentication AND role: 'Tutor')
router.route('/lessons').post(protect, tutor, createLesson);
router.route('/quizzes').post(protect, tutor, createQuiz);

// Routes for Learner content fetching (requires authentication)
router.route('/lessons/:language').get(protect, getLessonsByLanguage);
router.route('/quizzes/:lessonId').get(protect, getQuizByLessonId);
router.route('/quizzes/:lessonId/submit').post(protect, submitQuiz);

module.exports = router;