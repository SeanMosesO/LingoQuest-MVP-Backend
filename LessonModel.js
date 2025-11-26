// models/LessonModel.js
const mongoose = require('mongoose');

const LessonSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    targetLanguage: { type: String, required: true }, // e.g., 'French', 'Spanish'
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    videoUrl: { type: String, required: true }, // Short video-based language lessons
    textNotes: { type: String }, // Supplementary text explanations
    // Link to the tutor who uploaded the content
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model('Lesson', LessonSchema);
module.exports = Lesson;