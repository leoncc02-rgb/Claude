# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backend de un **sistema de asistencia estudiantil** construido con Node.js, Express y MongoDB. El código fuente está en español (comentarios, mensajes de API, nombres de variables).

## Commands

All commands run from `backend/`:

```bash
npm start          # production
npm run dev        # development with nodemon
npm test           # jest (all test suites)
npm test -- --testPathPattern=students   # single suite
```

## Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/student-attendance` | |
| `JWT_SECRET` | insecure fallback | always set in production |
| `JWT_EXPIRATION` | `7d` | |
| `BACKEND_PORT` | `5000` | |
| `NODE_ENV` | — | set to `development` to expose error details in responses |

## Architecture

```
backend/src/
  index.js                      # Express setup, middleware, route mounting
  config/database.js            # Mongoose connection (process.exit on failure)
  middleware/auth.js            # JWT verify → req.userId, req.userRole; generateToken()
  models/
    User.js                     # teacher/admin; password select:false; comparePassword(), toPublicJSON()
    Student.js                  # belongs to a teacher via teacherId
    Attendance.js               # unique index on (studentId, fecha); upsert on registration
    Feedback.js                 # user comments; tipo: sugerencia|error|general
  controllers/
    authController.js           # register, login, getCurrentUser, updateProfile, changePassword
    studentsController.js       # CRUD scoped to req.userId (teacher isolation)
    attendanceController.js     # registrar, obtener, reporte, actualizar
    feedbackController.js       # enviarComentario, obtenerComentarios (admin only)
  routes/
    auth.js         → /api/auth
    students.js     → /api/students
    attendance.js   → /api/attendance
    feedback.js     → /api/feedback
  __tests__/
    students.test.js
    attendance.test.js
    feedback.test.js
```

## Key Design Points

- `index.js` only calls `connectDB()` and `app.listen()` when `require.main === module`, so tests import the app without triggering a MongoDB connection.
- Every data-access route is scoped to `req.userId` — a teacher can only read/write their own students and attendance records.
- `Attendance` has a unique compound index on `(studentId, fecha)`. Registration uses `findOneAndUpdate` with `upsert: true` so re-submitting the same day overwrites the previous record.
- `GET /api/attendance/reporte/:studentId` must be declared before `PUT /api/attendance/:id` in the router to avoid Express matching `"reporte"` as an id parameter.
- Tests mock Mongoose models with `jest.mock()` — no real database needed.

## API Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/registro` | — | Register new teacher |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| PUT | `/api/auth/perfil` | ✓ | Update profile |
| PUT | `/api/auth/cambiar-password` | ✓ | Change password |
| GET | `/api/students` | ✓ | List own students |
| POST | `/api/students` | ✓ | Create student |
| GET | `/api/students/:id` | ✓ | Get student |
| PUT | `/api/students/:id` | ✓ | Update student |
| DELETE | `/api/students/:id` | ✓ | Delete student |
| POST | `/api/attendance` | ✓ | Register/upsert attendance record |
| GET | `/api/attendance` | ✓ | Query records (`?fecha=&studentId=`) |
| GET | `/api/attendance/reporte/:studentId` | ✓ | Attendance stats for a student |
| PUT | `/api/attendance/:id` | ✓ | Update attendance record |
| POST | `/api/feedback` | ✓ | Submit feedback |
| GET | `/api/feedback` | admin | List all feedback |
| GET | `/api/health` | — | Health check |
