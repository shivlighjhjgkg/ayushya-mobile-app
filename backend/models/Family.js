const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema(
  {
    familyName: {
      type: String,
      required: [true, 'Family name is required'],
      trim: true,
    },

    familyCode: {
      type: String,
      required: [true, 'Family code is required'],
      unique: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'families' }
);

module.exports = mongoose.model('Family', FamilySchema);
