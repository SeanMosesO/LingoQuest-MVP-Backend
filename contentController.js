// controllers/contentController.js (adding fetch functions)
// ... (existing imports and functions)
const Lesson = require('../models/LessonModel');
const Quiz = require('../models/QuizModel');
const axios = require('axios'); // Import axios for API calls

// @desc    Create a new lesson
// @route   POST /api/content/lessons
// @access  Private/Tutor
const createLesson = async (req, res) => {
  const { title, targetLanguage, level, videoUrl, textNotes } = req.body;

  try {
    const lesson = await Lesson.create({
      title,
      targetLanguage,
      level,
      videoUrl,
      textNotes,
      tutor: req.user._id, // Set the tutor ID from the authenticated user
    });

    res.status(201).json(lesson);
  } catch (error) {
    res.status(400).json({ message: 'Error creating lesson', error: error.message });
  }
};

// @desc    Create a quiz and link it to a lesson
// @route   POST /api/content/quizzes
// @access  Private/Tutor
const createQuiz = async (req, res) => {
  const { title, lessonId, questions, pointsAwarded } = req.body;

  try {
    // 1. Check if the lesson exists and belongs to the current tutor
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.tutor.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Lesson not found or you are not the owner' });
    }
    
    // 2. Check if a quiz already exists for this lesson
    const existingQuiz = await Quiz.findOne({ lesson: lessonId });
    if (existingQuiz) {
        return res.status(400).json({ message: 'A quiz already exists for this lesson.' });
    }

    const quiz = await Quiz.create({
      title,
      lesson: lessonId,
      questions,
      pointsAwarded: pointsAwarded || 10,
    });

    res.status(201).json(quiz);

  } catch (error) {
    res.status(400).json({ message: 'Error creating quiz', error: error.message });
  }
};

// @desc    Get all lessons for a specific language
// @route   GET /api/content/lessons/:language
// @access  Private/Learner (requires login)
const getLessonsByLanguage = async (req, res) => {
  const language = req.params.language;
  
  try {
    const lessons = await Lesson.find({ targetLanguage: language }).select('-tutor'); // Exclude tutor ID from public view

    if (lessons) {
      res.json(lessons);
    } else {
      res.status(404).json({ message: 'No lessons found for this language' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching lessons' });
  }
};

// @desc    Get a specific quiz by lesson ID
// @route   GET /api/content/quizzes/:lessonId
// @access  Private/Learner
const getQuizByLessonId = async (req, res) => {
  const lessonId = req.params.lessonId;

  try {
    // Find the quiz and select only necessary fields (exclude correct answers!)
    const quiz = await Quiz.findOne({ lesson: lessonId }).select('-questions.correctOptionIndex');

    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ message: 'Quiz not found for this lesson' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
};

// controllers/contentController.js (adding quiz submission logic)
// ... (existing imports: Lesson, Quiz)
const User = require('../models/UserModel'); // Import User model
const { protect } = require('../middleware/authMiddleware'); // For protecting the route

// Helper function to check if user completed the lesson today (for streaks)
const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

// @desc    Submit quiz answers, grade, and update user progress/points/streak
// @route   POST /api/content/quizzes/:lessonId/submit
// @access  Private/Learner
const submitQuiz = async (req, res) => {
    const lessonId = req.params.lessonId;
    const { answers } = req.body; // answers is an array: [{questionIndex: 0, selectedOptionIndex: 2}, ...]
    const userId = req.user._id;
    const MIN_PASS_SCORE = 0.7; // Example: Must get 70% or more to pass

    try {
        const quiz = await Quiz.findOne({ lesson: lessonId });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        const user = await User.findById(userId);
        if (user.completedLessons.includes(lessonId)) {
            return res.status(200).json({ message: 'Quiz already completed.', pointsAwarded: 0 });
        }

        let correctAnswers = 0;
        const totalQuestions = quiz.questions.length;

        // Grading Logic
        answers.forEach(submission => {
            const question = quiz.questions[submission.questionIndex];
            if (question && question.correctOptionIndex === submission.selectedOptionIndex) {
                correctAnswers++;
            }
        });

        const score = correctAnswers / totalQuestions;
        let pointsEarned = 0;
        let streakUpdated = false;

        // Gamification & Progress Update
        if (score >= MIN_PASS_SCORE) {
            pointsEarned = quiz.pointsAwarded;
            
            // 1. Update Points
            user.points += pointsEarned;

            // 2. Update Completed Lessons
            user.completedLessons.push(lessonId);

            // 3. Update Streak Logic (Simplified for MVP)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            // In a real app, you'd check last lesson completion timestamp.
            // For MVP simplicity, let's just increment if they successfully completed.
            user.streak += 1; 
            streakUpdated = true;
            
            await user.save();
        }

        res.json({
            success: score >= MIN_PASS_SCORE,
            score: parseFloat(score.toFixed(2)),
            correctAnswers,
            totalQuestions,
            pointsAwarded: pointsEarned,
            streakUpdated: streakUpdated,
            message: score >= MIN_PASS_SCORE ? 'Congratulations! Lesson complete.' : 'Keep practicing! Review the lesson notes.',
        });

    } catch (error) {
        console.error('Quiz Submission Error:', error);
        res.status(500).json({ message: 'Server error processing quiz submission' });
    }
};

// @desc    Handles user queries for the AI Chatbot
// @route   POST /api/content/chat
// @access  Private/Learner
const handleAIChat = async (req, res) => {
    const { message, contextLanguage } = req.body;
    const userId = req.user._id;

    if (!message || !contextLanguage) {
        return res.status(400).json({ message: 'Message and context language are required.' });
    }

    // 1. Construct the System Prompt (Crucial for an EdTech Bot)
    const systemPrompt = `You are a friendly, expert foreign language tutor named LingoQuest. 
                          Your goal is to help the user practice their ${contextLanguage} skills, understand contextual meaning, 
                          and learn dialects. Keep responses brief and highly relevant to language learning.`;
    
    // 2. Prepare the Request Body for the External AI Service
    const aiPayload = {
        model: "gemini-flash", // Example model name
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ],
        // Set temperature low for factual, non-creative language explanations
        temperature: 0.5, 
    };

    try {
        // 3. Make the API Call to the External AI Service
        const response = await axios.post(
            process.env.AI_SERVICE_URL,
            aiPayload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 4. Extract and Return the AI's Text Response
        // NOTE: The exact path to the response text depends on the external API structure.
        const aiResponseText = response.data.choices[0].message.content; // Example extraction path
        
        res.json({
            response: aiResponseText,
            source: 'LingoQuest AI',
        });

    } catch (error) {
        console.error('AI Chatbot Proxy Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: 'Failed to communicate with the AI service. Please try again later.' 
        });
    }
};

module.exports = { createLesson, createQuiz, getLessonsByLanguage, getQuizByLessonId, submitQuiz, handleAIChat };