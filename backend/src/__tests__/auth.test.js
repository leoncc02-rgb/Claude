const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

jest.mock('../models/User');

const USER_ID = '64b1234567890abcdef00001';
const teacherToken = generateToken(USER_ID, 'teacher');

const mockPublicUser = {
  _id: USER_ID,
  name: 'Test User',
  email: 'test@test.com',
  role: 'teacher',
  school: 'Colegio Test'
};

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne = jest.fn();
  User.findById = jest.fn();
  User.findByIdAndUpdate = jest.fn();
});

describe('POST /api/auth/registro', () => {
  it('registra un nuevo usuario correctamente', async () => {
    User.findOne.mockResolvedValue(null);
    const mockInstance = {
      _id: USER_ID,
      role: 'teacher',
      save: jest.fn().mockResolvedValue(true),
      toPublicJSON: jest.fn().mockReturnValue(mockPublicUser)
    };
    User.mockImplementation(() => mockInstance);

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ name: 'Test User', email: 'test@test.com', password: 'password123', school: 'Colegio Test' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual(mockPublicUser);
  });

  it('rechaza si el email ya está registrado', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ name: 'Test', email: 'existente@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/registrado/i);
  });

  it('devuelve 400 en ValidationError del modelo', async () => {
    User.findOne.mockResolvedValue(null);
    const validationError = Object.assign(new Error('Validation failed'), {
      name: 'ValidationError',
      errors: { password: { message: 'La contraseña es requerida' } }
    });
    User.mockImplementation(() => ({ save: jest.fn().mockRejectedValue(validationError) }));

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ name: 'Test', email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('inicia sesión correctamente', async () => {
    const mockInstance = {
      _id: USER_ID,
      role: 'teacher',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
      toPublicJSON: jest.fn().mockReturnValue(mockPublicUser)
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockInstance) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual(mockPublicUser);
    expect(mockInstance.save).toHaveBeenCalled();
  });

  it('rechaza si el email no existe', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rechaza si la contraseña es incorrecta', async () => {
    const mockInstance = { comparePassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockInstance) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'contraseñaincorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrectos/i);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el usuario autenticado', async () => {
    User.findById.mockResolvedValue({ toPublicJSON: jest.fn().mockReturnValue(mockPublicUser) });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toEqual(mockPublicUser);
    expect(User.findById).toHaveBeenCalledWith(USER_ID);
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('devuelve 404 si el usuario no existe', async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/auth/perfil', () => {
  it('actualiza el perfil correctamente', async () => {
    const updated = { ...mockPublicUser, name: 'Nuevo Nombre', phone: '123456789' };
    User.findByIdAndUpdate.mockResolvedValue({ toPublicJSON: jest.fn().mockReturnValue(updated) });

    const res = await request(app)
      .put('/api/auth/perfil')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Nuevo Nombre', phone: '123456789' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Nuevo Nombre');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      USER_ID,
      expect.any(Object),
      expect.objectContaining({ new: true })
    );
  });

  it('devuelve 404 si el usuario no existe', async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/auth/perfil')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).put('/api/auth/perfil').send({ name: 'Test' });

    expect(res.status).toBe(401);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('PUT /api/auth/cambiar-password', () => {
  it('cambia la contraseña correctamente', async () => {
    const mockInstance = {
      password: 'hashedOldPassword',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockInstance) });

    const res = await request(app)
      .put('/api/auth/cambiar-password')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ currentPassword: 'oldPass123', newPassword: 'newPass456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockInstance.password).toBe('newPass456');
    expect(mockInstance.save).toHaveBeenCalled();
  });

  it('rechaza si la contraseña actual es incorrecta', async () => {
    const mockInstance = {
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn()
    };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockInstance) });

    const res = await request(app)
      .put('/api/auth/cambiar-password')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ currentPassword: 'wrongPass', newPassword: 'newPass456' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(mockInstance.save).not.toHaveBeenCalled();
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app)
      .put('/api/auth/cambiar-password')
      .send({ currentPassword: 'old', newPassword: 'new' });

    expect(res.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });
});
