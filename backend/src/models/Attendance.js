const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fecha: { type: Date, required: [true, 'La fecha es requerida'] },
    estado: {
      type: String,
      enum: ['presente', 'ausente', 'tardanza'],
      required: [true, 'El estado es requerido']
    },
    observacion: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

// Un registro de asistencia por estudiante por día
attendanceSchema.index({ studentId: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
