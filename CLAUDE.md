# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an early-stage **student attendance system** backend built with Node.js, Express, and MongoDB. The codebase is written in Spanish (comments, API messages, variable names).

## Running the Server

There is no `package.json` yet. Once created, the entry point is `backend/src/index.js`. The server runs on `BACKEND_PORT` (default `5000`).

Required environment variables:
- `MONGODB_URI` — MongoDB connection string (default: `mongodb://localhost:27017/student-attendance`)
- `JWT_SECRET` — secret for signing JWTs (default fallback is insecure; always set in production)
- `JWT_EXPIRATION` — token lifespan (default: `7d`)
- `NODE_ENV` — controls whether error details leak in API responses

## Architecture

```
backend/src/
  index.js              # Express app setup, middleware, route mounting, error handlers
  config/
    database.js         # Mongoose connection (exits process on failure)
  middleware/
    auth.js             # JWT verify middleware + generateToken() helper
  controllers/
    authController.js   # register, login, getCurrentUser, updateProfile, changePassword
  routes/               # NOT YET CREATED — referenced in index.js
    auth.js
    students.js
    attendance.js
  models/               # NOT YET CREATED — referenced by authController
    User.js             # Must expose: comparePassword(), toPublicJSON(), password (select:false)
```

### Key design points

- `auth` middleware attaches `req.userId` and `req.userRole` from the decoded JWT.
- `User.password` must use `select: false` in the Mongoose schema so it is excluded from normal queries; `authController` uses `.select('+password')` explicitly when needed.
- `User.toPublicJSON()` is the canonical way to strip sensitive fields before sending a user object in a response.
- The global error handler exposes `err.message` only when `NODE_ENV === 'development'`.
- All API routes are prefixed with `/api`. Health check is at `GET /api/health`.

### API routes (to be implemented)

| Mount point        | Router file              |
|--------------------|--------------------------|
| `/api/auth`        | `routes/auth.js`         |
| `/api/students`    | `routes/students.js`     |
| `/api/attendance`  | `routes/attendance.js`   |
