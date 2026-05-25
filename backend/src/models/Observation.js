const mongoose = require('mongoose');

const observationSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  type: {
    type: String,
    required: [true, 'El tipo de observación es obligatorio'],
    enum: {
      values: ['general', 'personal', 'pendiente', 'recordatorio', 'tarea'],
      message: 'Tipo inválido. Valores: general, personal, pendiente, recordatorio, tarea'
    },
    default: 'general'
  },
  content: {
    type: String,
    required: [true, 'El contenido de la observación es obligatorio'],
    trim: true,
    maxlength: [2000, 'La observación no puede superar 2000 caracteres']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    default: null
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
observationSchema.index({ courseId: 1, type: 1 });
observationSchema.index({ courseId: 1, studentId: 1 });
observationSchema.index({ teacherId: 1, createdAt: -1 });

module.exports = mongoose.model('Observation', observationSchema);
