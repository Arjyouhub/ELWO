const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artistName: { type: String, required: true, trim: true, index: true },
    artistId: { type: String, default: null, index: true },
    albumTitle: { type: String, default: null, trim: true },
    albumId: { type: String, default: null },
    language: {
      type: String,
      required: true,
      enum: ['Malayalam', 'Tamil', 'Hindi', 'English', 'All'],
      index: true,
    },
    genre: { type: String, default: 'Film' },
    streamUrl: { type: String, required: true },
    artworkUrl: { type: String, default: null },
    provider: { type: String, default: 'elwo', index: true }, // 'elwo', 'jiosaavn', 'manual'
    providerTrackId: { type: String, required: true, index: true },
    releaseDate: { type: String, required: true, index: true }, // actual song release date e.g. '2024-04-11'
    addedAt: { type: Date, default: Date.now, index: true }, // date added to ELWO catalog
    isPublished: { type: Boolean, default: true, index: true },
    duration: { type: Number, required: true, default: 180 }, // in seconds
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    skipCount: { type: Number, default: 0 },
    lyrics: { type: String, default: null },
    year: { type: String, default: null },
    audioSource: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for compatibility across mobile & backend naming conventions
trackSchema.virtual('artist').get(function () {
  return this.artistName;
});

trackSchema.virtual('album').get(function () {
  return this.albumTitle;
});

trackSchema.virtual('artwork').get(function () {
  return this.artworkUrl;
});

trackSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : this.providerTrackId;
});

// Dynamic NEW badge detection: Added to ELWO within last 14 days OR released within last 45 days
trackSchema.virtual('isNew').get(function () {
  const now = Date.now();
  const addedMs = this.addedAt ? new Date(this.addedAt).getTime() : 0;
  const isRecentlyAdded = now - addedMs < 14 * 24 * 60 * 60 * 1000;

  let isRecentlyReleased = false;
  if (this.releaseDate) {
    const relMs = new Date(this.releaseDate).getTime();
    if (!isNaN(relMs)) {
      isRecentlyReleased = now - relMs < 45 * 24 * 60 * 60 * 1000;
    }
  }
  return isRecentlyAdded || isRecentlyReleased;
});

// Compound unique index: provider + providerTrackId (CRITICAL: prevents duplicate songs)
trackSchema.index({ provider: 1, providerTrackId: 1 }, { unique: true });

// Optimized query indexes
trackSchema.index({ isPublished: 1, language: 1, addedAt: -1 });
trackSchema.index({ isPublished: 1, language: 1, releaseDate: -1 });
trackSchema.index({ isPublished: 1, language: 1, playCount: -1 });

module.exports = mongoose.model('Track', trackSchema);
