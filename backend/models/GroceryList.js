const mongoose = require('mongoose');

const GroceryListSchema = new mongoose.Schema(
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
    items: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'grocery_lists',
  }
);

GroceryListSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('GroceryList', GroceryListSchema);
