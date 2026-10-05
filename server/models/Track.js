const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artistName: { type: String, required: true, index: true },
    artistId: { type: String, index: true },
    albumTitle: { type: String, default: null },
    albumId: { type: String, default: null },
    duration: { type: Number, required: true }, // in seconds
    language: { type: String, required: true, index: true },
    genre: { type: String, default: 'Film' },
    streamUrl: { type: String, required: true },
    artworkUrl: { type: String, default: null },
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    skipCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ language: 1, playCount: -1 });

module.exports = mongoose.model('Track', trackSchema);
