const request = require('supertest');
const app = require('../index');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');

jest.mock('../models/Attendance');
jest.mock('../models/Student');

const TEACHER_ID = '64b1234567890abcdef00001';
const STUDENT_ID = '64b1234567890abcdef00010';
const teacherToken = generateToken(TEACHER_ID, 'teacher');

beforeEach(() => {
  jest.clearAllMocks();
  Attendance.find = jest.fn();
  Attendance.findOneAndUpdate = jest.fn();
  Student.findOne = jest.fn();
});

describe('POST /api/attendance', () => {
  it('registra asistencia correctamente', async () => {
    const mockStudent = { _id: STUDENT_ID, name: 'Ana García', teacherId: TEACHER_ID };
    Student.findOne.mockResolvedValue(mockStudent);

    const mockAsistencia = { _id: 'att1', studentId: STUDENT_ID, estado: 'presente', fecha: '2026-05-24' };
    Attendance.findOneAndUpdate.mockResolvedValue(mockAsistencia);

    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId: STUDENT_ID, fecha: '2026-05-24', estado: 'presente' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.asistencia.estado).toBe('presente');
    expect(Student.findOne).toHaveBeenCalledWith({ _id: STUDENT_ID, teacherId: TEACHER_ID });
  });

  it('devuelve 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId: STUDENT_ID, estado: 'presente' }); // falta fecha

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/requeridos/i);
    expect(Student.findOne).not.toHaveBeenCalled();
  });

  it('devuelve 404 si el estudiante no pertenece al profesor', async () => {
    Student.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId: STUDENT_ID, fecha: '2026-05-24', estado: 'presente' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rechaza la solicitud sin token', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .send({ studentId: STUDENT_ID, fecha: '2026-05-24', estado: 'presente' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/attendance', () => {
  it('devuelve todos los registros del profesor', async () => {
    const mockAsistencias = [
      { _id: 'att1', studentId: { name: 'Ana' }, estado: 'presente', fecha: '2026-05-24' },
      { _id: 'att2', studentId: { name: 'Carlos' }, estado: 'ausente', fecha: '2026-05-24' }
    ];
    Attendance.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockAsistencias)
    });

    const res = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.asistencias).toHaveLength(2);
    expect(Attendance.find).toHaveBeenCalledWith({ teacherId: TEACHER_ID });
  });

  it('aplica filtro por fecha y studentId desde query params', async () => {
    Attendance.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    });

    await request(app)
      .get(`/api/attendance?fecha=2026-05-24&studentId=${STUDENT_ID}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(Attendance.find).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: STUDENT_ID, teacherId: TEACHER_ID })
    );
    const filtro = Attendance.find.mock.calls[0][0];
    expect(filtro).toHaveProperty('fecha');
  });

  it('rechaza la solicitud sin token', async () => {
    const res = await request(app).get('/api/attendance');

    expect(res.status).toBe(401);
    expect(Attendance.find).not.toHaveBeenCalled();
  });
});

describe('GET /api/attendance/reporte/:studentId', () => {
  it('devuelve el reporte de asistencia del estudiante', async () => {
    const mockStudent = { _id: STUDENT_ID, name: 'Ana García', teacherId: TEACHER_ID };
    Student.findOne.mockResolvedValue(mockStudent);

    const mockRegistros = [
      { estado: 'presente' },
      { estado: 'presente' },
      { estado: 'ausente' },
      { estado: 'tardanza' }
    ];
    Attendance.find.mockResolvedValue(mockRegistros);

    const res = await request(app)
      .get(`/api/attendance/reporte/${STUDENT_ID}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reporte.total).toBe(4);
    expect(res.body.reporte.presentes).toBe(2);
    expect(res.body.reporte.ausentes).toBe(1);
    expect(res.body.reporte.tardanzas).toBe(1);
    expect(res.body.reporte.porcentajeAsistencia).toBe(50);
  });

  it('devuelve porcentajeAsistencia 0 cuando no hay registros', async () => {
    Student.findOne.mockResolvedValue({ _id: STUDENT_ID, name: 'Ana' });
    Attendance.find.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/attendance/reporte/${STUDENT_ID}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reporte.total).toBe(0);
    expect(res.body.reporte.porcentajeAsistencia).toBe(0);
  });

  it('devuelve 404 si el estudiante no pertenece al profesor', async () => {
    Student.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/attendance/reporte/${STUDENT_ID}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(Attendance.find).not.toHaveBeenCalled();
  });
});

describe('PUT /api/attendance/:id', () => {
  it('actualiza el estado de la asistencia', async () => {
    const updatedAtt = {
      _id: 'att1',
      studentId: { name: 'Ana', matricula: '001' },
      estado: 'tardanza',
      observacion: 'Llegó 10 min tarde'
    };
    Attendance.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(updatedAtt)
    });

    const res = await request(app)
      .put('/api/attendance/att1')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ estado: 'tardanza', observacion: 'Llegó 10 min tarde' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.asistencia.estado).toBe('tardanza');
    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'att1', teacherId: TEACHER_ID },
      expect.any(Object),
      expect.objectContaining({ new: true })
    );
  });

  it('devuelve 404 si el registro no existe', async () => {
    Attendance.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null)
    });

    const res = await request(app)
      .put('/api/attendance/inexistente')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ estado: 'presente' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
