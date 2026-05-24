const Student = require('../models/Student');

exports.listarEstudiantes = async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.userId }).sort({ name: 1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.crearEstudiante = async (req, res) => {
  try {
    const { name, matricula, grado, seccion, email, telefono } = req.body;
    const student = new Student({ name, matricula, grado, seccion, email, telefono, teacherId: req.userId });
    await student.save();
    res.status(201).json({ success: true, message: 'Estudiante creado correctamente', student });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear estudiante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.obtenerEstudiante = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.actualizarEstudiante = async (req, res) => {
  try {
    const { name, matricula, grado, seccion, email, telefono } = req.body;
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { name, matricula, grado, seccion, email, telefono },
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }
    res.json({ success: true, message: 'Estudiante actualizado correctamente', student });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estudiante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.eliminarEstudiante = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }
    res.json({ success: true, message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar estudiante',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
