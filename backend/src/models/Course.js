const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del curso es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede superar 100 caracteres']
  },
  grade: {
    type: String,
    required: [true, 'El grado es obligatorio'],
    trim: true
  },
  section: {
    type: String,
    trim: true,
    default: ''
  },
  period: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#4F46E5'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient teacher queries
courseSchema.index({ teacherId: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
