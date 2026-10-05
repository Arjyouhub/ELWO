const mongoose = require('mongoose');

const ambientSoundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Rain',
        'Train',
        'Bus',
        'Tea Shop',
        'Cafe',
        'Ocean',
        'Forest',
        'Night',
        'Traffic',
        'Nature',
      ],
      required: true,
      index: true,
    },
    audioUrl: { type: String, required: true },
    iconName: { type: String, default: 'water' },
    defaultVolume: { type: Number, default: 0.5, min: 0, max: 1 },
    isKeralaSpecial: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AmbientSound', ambientSoundSchema);
