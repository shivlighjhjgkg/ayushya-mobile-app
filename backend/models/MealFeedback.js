const mongoose = require('mongoose');

const MealFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: true,
    },
    mealName: {
      type: String,
      required: true,
      trim: true,
    },
    feedback: {
      type: String,
      enum: ['good', 'neutral', 'bad'],
      required: true,
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'meal_feedback',
  }
);

module.exports = mongoose.model('MealFeedback', MealFeedbackSchema);
