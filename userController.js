// controllers/userController.js
const User = require('../models/UserModel');
const generateToken = require('../utils/generateToken'); // Will create this next
const Lesson = require('../models/LessonModel'); // Import Lesson model

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, targetLanguage, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
    targetLanguage,
    role: role || 'Learner', // Default to Learner if not specified
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      targetLanguage: user.targetLanguage,
      role: user.role,
      token: generateToken(user._id), // Send JWT token for session management
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      targetLanguage: user.targetLanguage,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get dashboard data for authenticated user
// @route   GET /api/users/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Calculate Progress (Simple MVP Calculation)
        const targetLanguage = user.targetLanguage;
        const totalLessons = await Lesson.countDocuments({ targetLanguage });
        const completedCount = user.completedLessons.length;
        
        // Calculate the completion percentage
        const progressPercentage = totalLessons > 0 ? 
            parseFloat(((completedCount / totalLessons) * 100).toFixed(1)) : 0;
            
        // 2. Fetch Recommended Lessons (MVP simplicity: just the next uncompleted lesson)
        const allLessons = await Lesson.find({ targetLanguage }).sort({ createdAt: 1 });
        const nextLesson = allLessons.find(lesson => !user.completedLessons.includes(lesson._id));

        // 3. Construct Dashboard Response
        res.json({
            name: user.name,
            targetLanguage: user.targetLanguage,
            points: user.points,
            streak: user.streak,
            progress: {
                targetLanguage: targetLanguage,
                completed: completedCount,
                total: totalLessons,
                percentage: progressPercentage,
            },
            nextLesson: nextLesson ? { 
                id: nextLesson._id, 
                title: nextLesson.title,
                videoUrl: nextLesson.videoUrl // Allow fetching lesson content
            } : null,
            // Future: achievements, leaderboards, daily goals can be added here
        });

    } catch (error) {
        console.error('Dashboard Fetch Error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
};

module.exports = { registerUser, authUser };