const mongoose = require('mongoose');

const ambientMixSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    soundLayers: [
      {
        soundId: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbientSound' },
        soundName: { type: String },
        volume: { type: Number, default: 0.5, min: 0, max: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AmbientMix', ambientMixSchema);
