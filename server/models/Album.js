const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artistName: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
    coverUrl: { type: String, default: null },
    releaseDate: { type: Date, default: null },
    trackCount: { type: Number, default: 0 },
    language: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Album', albumSchema);
