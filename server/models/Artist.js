const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    genres: { type: [String], default: [] },
    imageUrl: { type: String, default: null },
    followerCount: { type: Number, default: 0 },
    monthlyListeners: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Artist', artistSchema);
