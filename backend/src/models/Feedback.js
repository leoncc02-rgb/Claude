const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje es requerido'],
      trim: true,
      maxlength: [1000, 'El mensaje no puede superar 1000 caracteres']
    },
    tipo: {
      type: String,
      enum: ['sugerencia', 'error', 'general'],
      default: 'general'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
