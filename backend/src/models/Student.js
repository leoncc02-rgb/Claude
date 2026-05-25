const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [60, 'El nombre no puede superar 60 caracteres']
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
    maxlength: [60, 'El apellido no puede superar 60 caracteres']
  },
  gender: {
    type: String,
    required: [true, 'El género es obligatorio'],
    enum: {
      values: ['M', 'F'],
      message: 'El género debe ser M o F'
    }
  },
  photo: {
    type: String,
    default: null
  },
  seatNumber: {
    type: Number,
    min: [1, 'El número de lista debe ser mayor a 0'],
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  parentName: {
    type: String,
    trim: true,
    default: ''
  },
  parentPhone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for initials (for avatar)
studentSchema.virtual('initials').get(function() {
  return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

// Indexes
studentSchema.index({ teacherId: 1, isActive: 1 });
studentSchema.index({ courses: 1 });
studentSchema.index({ lastName: 1, firstName: 1 });

module.exports = mongoose.model('Student', studentSchema);
