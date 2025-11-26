// models/QuizModel.js
const mongoose = require('mongoose');

const QuestionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }, // Index of the correct answer in the options array
});

const QuizSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true }, // Quiz is tied to one specific Lesson
    questions: [QuestionSchema],
    pointsAwarded: { type: Number, default: 10 }, // Gamification points
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', QuizSchema);
module.exports = Quiz;