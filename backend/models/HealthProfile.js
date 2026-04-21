const mongoose = require('mongoose');

const HealthProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },

    doshaScores: {
      vata: { type: Number, required: true, min: 0 },
      pitta: { type: Number, required: true, min: 0 },
      kapha: { type: Number, required: true, min: 0 },
    },

    dominantDosha: {
      type: String,
      enum: ['vata', 'pitta', 'kapha'],
      required: true,
    },

    quizCompleted: {
      type: Boolean,
      default: true,
    },

    allergens: {
      type: [String],
      default: [],
    },

    dateOfBirth: {
      type: Date,
    },

    age: {
      type: Number,
      min: 0,
      max: 150,
    },

    bmi: {
      type: Number,
      min: 0,
    },

    dietaryPreference: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian'],
    },

    desha: {
      type: String,
      enum: ['north', 'east', 'west', 'south', 'global'],
    },

    season: {
      type: String,
      enum: ['summer', 'winter'],
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'health_profiles'
  }
);

module.exports = mongoose.model('HealthProfile', HealthProfileSchema);