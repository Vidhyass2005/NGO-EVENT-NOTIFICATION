// services/api.js
// Axios instance with JWT auto-attach and 401 redirect
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register:      (data) => API.post('/api/auth/register', data),
  login:         (data) => API.post('/api/auth/login', data),
  getMe:         ()     => API.get('/api/auth/me'),
  updateProfile: (data) => API.put('/api/auth/profile', data),
  getAllUsers:   ()     => API.get('/api/auth/users'),
};

export const eventAPI = {
  getAll:    (params)     => API.get('/api/events', { params }),
  getOne:    (id)         => API.get(`/api/events/${id}`),
  create:    (data)       => API.post('/api/events', data),
  update:    (id, data)   => API.put(`/api/events/${id}`, data),
  approve:   (id)         => API.put(`/api/events/${id}/approve`),
  cancel:    (id, reason) => API.put(`/api/events/${id}/cancel`, { reason }),
  complete:  (id)         => API.put(`/api/events/${id}/complete`),
  delete:    (id)         => API.delete(`/api/events/${id}`),
  analytics: ()           => API.get('/api/events/analytics'),
};

export const participationAPI = {
  // Now accepts form details as second argument
  register:         (eventId, details) => API.post(`/api/participation/register/${eventId}`, details),
  unregister:       (eventId)          => API.delete(`/api/participation/unregister/${eventId}`),
  myHistory:        ()                 => API.get('/api/participation/my-history'),
  markAttend:       (id)               => API.put(`/api/participation/attend/${id}`),
  getParticipants:  (eventId)          => API.get(`/api/participation/event/${eventId}`),
  submitFeedback:   (eventId, data)    => API.post(`/api/participation/feedback/${eventId}`, data),
  getEventFeedback: (eventId)          => API.get(`/api/participation/feedback/event/${eventId}`),
};

export const certificateAPI = {
  generate: (eventId) => API.post(`/api/certificates/generate/${eventId}`, {}, { responseType: 'blob' }),
  getMine:  ()        => API.get('/api/certificates/my'),
  verify:   (id)      => API.get(`/api/certificates/verify/${id}`),
};

export const notificationAPI = {
  getAll:   ()    => API.get('/api/notifications'),
  markRead: (ids) => API.put('/api/notifications/read', { ids }),
  delete:   (id)  => API.delete(`/api/notifications/${id}`),
};

export default API;
