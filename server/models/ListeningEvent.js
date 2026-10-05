const mongoose = require('mongoose');

const listeningEventSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // User ObjectId or guestSessionId
    trackId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ['PLAY_START', 'PLAY_COMPLETE', 'SKIP', 'LIKE', 'UNLIKE'],
      required: true,
      index: true,
    },
    playbackDuration: { type: Number, default: 0 }, // seconds played
    completionRate: { type: Number, default: 0 }, // 0.0 to 1.0
    language: { type: String, default: null },
    genre: { type: String, default: null },
    artistId: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

listeningEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('ListeningEvent', listeningEventSchema);
