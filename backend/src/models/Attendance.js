const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['presente', 'ausente', 'tardanza'],
      message: 'Estado inválido. Valores: presente, ausente, tardanza'
    },
    default: 'presente'
  },
  justification: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'La fecha es obligatoria']
  },
  records: [attendanceRecordSchema],
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Unique attendance per course per date
attendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teacherId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
