const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la evaluación es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede superar 100 caracteres']
  },
  type: {
    type: String,
    required: [true, 'El tipo de evaluación es obligatorio'],
    enum: {
      values: ['tarea', 'proyecto', 'examen', 'participacion', 'otro'],
      message: 'Tipo inválido. Valores permitidos: tarea, proyecto, examen, participacion, otro'
    },
    default: 'otro'
  },
  subject: {
    type: String,
    required: [true, 'La materia es obligatoria'],
    enum: {
      values: ['tecnologia', 'informatica'],
      message: 'La materia debe ser tecnologia o informatica'
    }
  },
  weight: {
    type: Number,
    required: [true, 'El peso/ponderación es obligatorio'],
    min: [0, 'El peso no puede ser negativo'],
    max: [100, 'El peso no puede superar 100'],
    default: 10
  },
  maxScore: {
    type: Number,
    default: 20,
    min: [1, 'La nota máxima debe ser al menos 1']
  },
  dueDate: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
evaluationSchema.index({ courseId: 1, subject: 1 });
evaluationSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
