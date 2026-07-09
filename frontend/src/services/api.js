import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Mappings
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  logout: (data) => api.post('/auth/logout', data),
};

export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getSkills: () => api.get('/student/skills'),
  getRecommendations: () => api.get('/student/recommendations'),
  getApplications: () => api.get('/student/applications'),
  apply: (jobId) => api.post(`/student/apply/${jobId}`),
  getNotifications: () => api.get('/student/notifications'),
  markNotificationRead: (id) => api.put(`/student/notifications/${id}/read`),
  getInternships: (params) => api.get('/student/internships', { params }),
  
  uploadPhoto: (formData) => api.post('/student/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadResume: (formData) => api.post('/student/upload/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCertificate: (formData) => api.post('/student/upload/certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const recruiterAPI = {
  getProfile: () => api.get('/recruiter/profile'),
  updateProfile: (data) => api.put('/recruiter/profile', data),
  getMyInternships: () => api.get('/recruiter/internships'),
  postInternship: (data) => api.post('/recruiter/internships', data),
  updateInternship: (id, data) => api.put(`/recruiter/internships/${id}`, data),
  deleteInternship: (id) => api.delete(`/recruiter/internships/${id}`),
  getApplicationsReceived: () => api.get('/recruiter/applications'),
  updateApplicationStatus: (appId, status) => api.put(`/recruiter/application/${appId}/status?status=${status}`),
  getCandidates: (query = {}) => api.get('/recruiter/candidates', { params: query }),
  getNotifications: () => api.get('/recruiter/notifications'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (query = {}) => api.get('/admin/users', { params: query }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStudents: () => api.get('/admin/students'),
  getRecruiters: () => api.get('/admin/recruiters'),
  getUniversities: () => api.get('/admin/universities'),
  getCertificateRecords: () => api.get('/admin/certificates/records'),
  createCertificateRecord: (data) => api.post('/admin/certificates/records', data),
  getPendingCertificates: () => api.get('/admin/certificates/pending'),
  verifyOcr: (studentId) => api.get(`/admin/certificates/verify-ocr/${studentId}`),
  approveCertificate: (studentId, certificateId) => api.post(`/admin/certificates/approve/${studentId}?certificateId=${certificateId}`),
  rejectCertificate: (studentId, reason) => api.post(`/admin/certificates/reject/${studentId}?reason=${reason}`),
  getBlockchainLedger: () => api.get('/admin/blockchain/ledger'),
  validateBlockchain: () => api.get('/admin/blockchain/validate'),
};

export default api;
export const API_URL = API_BASE_URL;
export const STATIC_FILE_URL = 'http://localhost:8080/uploads/';
