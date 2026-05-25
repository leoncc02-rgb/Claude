const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  score: {
    type: Number,
    min: [0, 'La nota no puede ser negativa'],
    default: null
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Unique constraint: one grade per student per evaluation
gradeSchema.index({ studentId: 1, evaluationId: 1 }, { unique: true });
gradeSchema.index({ courseId: 1, evaluationId: 1 });
gradeSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
