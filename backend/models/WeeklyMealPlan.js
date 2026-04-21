const mongoose = require('mongoose');

const MealChoiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    course: { type: String, required: true },
    digestibility: { type: String },
    dietary: { type: String },
    region: { type: String },
    season: { type: String },
    doshaImpact: {
      vata: { type: Number, default: 0 },
      pitta: { type: Number, default: 0 },
      kapha: { type: Number, default: 0 },
    },
    url: { type: String },
    matchedIngredients: { type: [String], default: [] },
    unmatchedIngredients: { type: [String], default: [] },
  },
  { _id: false }
);

const DayPlanSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    breakfast: { type: MealChoiceSchema, required: true },
    lunchMain: { type: MealChoiceSchema, required: true },
    lunchSide: { type: MealChoiceSchema, required: true },
    dinnerMain: { type: MealChoiceSchema, required: true },
    dinnerSide: { type: MealChoiceSchema, required: true },
    appetizer: { type: MealChoiceSchema, required: true },
    dessert: { type: MealChoiceSchema, required: true },
  },
  { _id: false }
);

const WeeklyMealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
      index: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    days: {
      type: [DayPlanSchema],
      default: [],
    },
    filters: {
      age: { type: Number },
      dietaryPreference: { type: String },
      season: { type: String },
      desha: { type: String },
      allergens: { type: [String], default: [] },
      blockedMeals: { type: [String], default: [] },
      groceryItemsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: 'weekly_meal_plans',
  }
);

WeeklyMealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyMealPlan', WeeklyMealPlanSchema);
