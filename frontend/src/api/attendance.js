import client from './client';

export const attendanceApi = {
  get: (params = {}) => client.get('/attendance', { params }),
  save: (data) => client.post('/attendance', data),
  getDates: (courseId) => client.get('/attendance/dates', { params: { courseId } }),
  getStudentHistory: (studentId, courseId) =>
    client.get(`/attendance/student/${studentId}`, { params: { courseId } })
};
