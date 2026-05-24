const request = require('supertest');
const app = require('../index');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');

jest.mock('../models/Student');

const TEACHER_ID = '64b1234567890abcdef00001';
const OTHER_ID = '64b1234567890abcdef00009';
const teacherToken = generateToken(TEACHER_ID, 'teacher');

beforeEach(() => {
  jest.clearAllMocks();
  Student.find = jest.fn();
  Student.findOne = jest.fn();
  Student.findOneAndUpdate = jest.fn();
  Student.findOneAndDelete = jest.fn();
});

describe('GET /api/students', () => {
  it('lista los estudiantes del profesor autenticado', async () => {
    const mockStudents = [
      { _id: 'st1', name: 'Ana García', teacherId: TEACHER_ID },
      { _id: 'st2', name: 'Carlos López', teacherId: TEACHER_ID }
    ];
    Student.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockStudents) });

    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(2);
    expect(Student.find).toHaveBeenCalledWith({ teacherId: TEACHER_ID });
  });

  it('rechaza la solicitud sin token', async () => {
    const res = await request(app).get('/api/students');

    expect(res.status).toBe(401);
    expect(Student.find).not.toHaveBeenCalled();
  });
});

describe('POST /api/students', () => {
  it('crea un estudiante correctamente', async () => {
    const savedStudent = { _id: 'st1', name: 'Ana García', grado: '3ro', teacherId: TEACHER_ID };
    Student.mockImplementation(() => ({
      ...savedStudent,
      save: jest.fn().mockResolvedValue(savedStudent)
    }));

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Ana García', grado: '3ro', seccion: 'A' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.student.name).toBe('Ana García');
    expect(Student).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana García', teacherId: TEACHER_ID })
    );
  });

  it('devuelve 400 cuando falta el nombre (ValidationError)', async () => {
    const validationError = Object.assign(new Error('Validation failed'), {
      name: 'ValidationError',
      errors: { name: { message: 'El nombre es requerido' } }
    });
    Student.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(validationError)
    }));

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ grado: '3ro' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/requerido/i);
  });

  it('rechaza la solicitud sin token', async () => {
    const res = await request(app).post('/api/students').send({ name: 'Test' });

    expect(res.status).toBe(401);
    expect(Student).not.toHaveBeenCalled();
  });
});

describe('GET /api/students/:id', () => {
  it('devuelve el estudiante indicado', async () => {
    const mockStudent = { _id: 'st1', name: 'Ana García', teacherId: TEACHER_ID };
    Student.findOne.mockResolvedValue(mockStudent);

    const res = await request(app)
      .get('/api/students/st1')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.name).toBe('Ana García');
    expect(Student.findOne).toHaveBeenCalledWith({ _id: 'st1', teacherId: TEACHER_ID });
  });

  it('devuelve 404 si el estudiante no existe o pertenece a otro profesor', async () => {
    Student.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/students/inexistente')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/students/:id', () => {
  it('actualiza el estudiante correctamente', async () => {
    const updated = { _id: 'st1', name: 'Ana Martínez', grado: '4to', teacherId: TEACHER_ID };
    Student.findOneAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/students/st1')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Ana Martínez', grado: '4to' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.name).toBe('Ana Martínez');
    expect(Student.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'st1', teacherId: TEACHER_ID },
      expect.any(Object),
      expect.objectContaining({ new: true })
    );
  });

  it('devuelve 404 si el estudiante no existe', async () => {
    Student.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/students/inexistente')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/students/:id', () => {
  it('elimina el estudiante correctamente', async () => {
    Student.findOneAndDelete.mockResolvedValue({ _id: 'st1', name: 'Ana García' });

    const res = await request(app)
      .delete('/api/students/st1')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Student.findOneAndDelete).toHaveBeenCalledWith({ _id: 'st1', teacherId: TEACHER_ID });
  });

  it('devuelve 404 si el estudiante no existe', async () => {
    Student.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/students/inexistente')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
