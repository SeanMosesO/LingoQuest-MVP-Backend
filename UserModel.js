// models/UserModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed for password hashing

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Language barriers are a major challenge... language selection on onboarding
    targetLanguage: { type: String, required: true, default: 'Spanish' }, 
    role: { 
      type: String, 
      enum: ['Learner', 'Tutor'],
      required: true,
      default: 'Learner' 
    },
    // Gamification fields
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    // NEW: Track completed lessons for progress calculation
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Pre-save hook: Hash the password before saving a new user
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check password on login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;