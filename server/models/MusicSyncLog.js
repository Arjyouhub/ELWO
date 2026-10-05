const mongoose = require('mongoose');

const musicSyncLogSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUCCESS', 'FAILED'],
      default: 'IN_PROGRESS',
    },
    tracksScanned: { type: Number, default: 0 },
    tracksAdded: { type: Number, default: 0 },
    tracksUpdated: { type: Number, default: 0 },
    tracksSkipped: { type: Number, default: 0 },
    tracksFailed: { type: Number, default: 0 },
    errorSummary: { type: String, default: null },
    triggeredBy: { type: String, default: 'SYSTEM' }, // 'SYSTEM' | 'ADMIN'
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MusicSyncLog', musicSyncLogSchema);
