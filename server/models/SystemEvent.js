const mongoose = require('mongoose');

const systemEventSchema = new mongoose.Schema(
  {
    component: {
      type: String,
      enum: [
        'Backend',
        'MongoDB',
        'Google Auth',
        'Google Play Billing',
        'RTDN',
        'Music Provider',
        'Background Jobs',
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['HEALTHY', 'WARNING', 'ERROR'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemEvent', systemEventSchema);
