const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

exports.registrarAsistencia = async (req, res) => {
  try {
    const { studentId, fecha, estado, observacion } = req.body;

    if (!studentId || !fecha || !estado) {
      return res.status(400).json({
        success: false,
        message: 'studentId, fecha y estado son requeridos'
      });
    }

    const student = await Student.findOne({ _id: studentId, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    const asistencia = await Attendance.findOneAndUpdate(
      { studentId, fecha: fechaNormalizada },
      { $set: { studentId, teacherId: req.userId, fecha: fechaNormalizada, estado, observacion } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: 'Asistencia registrada correctamente', asistencia });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al registrar asistencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.obtenerAsistencia = async (req, res) => {
  try {
    const { fecha, studentId } = req.query;
    const filtro = { teacherId: req.userId };

    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setUTCHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setUTCHours(23, 59, 59, 999);
      filtro.fecha = { $gte: inicio, $lte: fin };
    }

    if (studentId) {
      filtro.studentId = studentId;
    }

    const asistencias = await Attendance.find(filtro)
      .populate('studentId', 'name matricula grado seccion')
      .sort({ fecha: -1, createdAt: -1 });

    res.json({ success: true, asistencias });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener asistencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.reporteEstudiante = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    const registros = await Attendance.find({ studentId: req.params.studentId, teacherId: req.userId });

    const total = registros.length;
    const presentes = registros.filter((r) => r.estado === 'presente').length;
    const ausentes = registros.filter((r) => r.estado === 'ausente').length;
    const tardanzas = registros.filter((r) => r.estado === 'tardanza').length;

    res.json({
      success: true,
      student,
      reporte: {
        total,
        presentes,
        ausentes,
        tardanzas,
        porcentajeAsistencia: total > 0 ? Math.round((presentes / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.actualizarAsistencia = async (req, res) => {
  try {
    const { estado, observacion } = req.body;

    const asistencia = await Attendance.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $set: { estado, observacion } },
      { new: true, runValidators: true }
    ).populate('studentId', 'name matricula');

    if (!asistencia) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    res.json({ success: true, message: 'Asistencia actualizada correctamente', asistencia });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar asistencia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
