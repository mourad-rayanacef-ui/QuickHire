import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // ← 60 seconds timeout for Render wake-up
});

// Request interceptor - adds token to every request
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

// Response interceptor - handles errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors (Render wake-up)
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('⏱️ Request timeout - backend might be waking up from sleep');
      return Promise.reject({
        response: {
          data: {
            error: 'Server is waking up, please wait a moment and try again...',
            status: 'timeout'
          }
        }
      });
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Network error - check your connection or backend status');
      return Promise.reject({
        response: {
          data: {
            error: 'Unable to connect to server. Please check your internet connection.',
            status: 'network_error'
          }
        }
      });
    }

    // Handle 404 errors
    if (error.response?.status === 404) {
      console.error('❌ 404 - Endpoint not found or backend is not running');
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accountType');
      localStorage.removeItem('Image');
      window.location.href = '/SignIn';
    }

    // Handle 500 errors
    if (error.response?.status === 500) {
      console.error('💥 Server error - backend crashed');
    }

    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION ====================
export const authAPI = {
  signUp: async (userData) => {
    const response = await api.post('/signIn', userData);
    return response.data;
  },

  logIn: async (credentials) => {
    const response = await api.post('/logIn', credentials);
    return response.data;
  },

  logOut: async () => {
    const response = await api.post('/logOut');
    return response.data;
  },

  // ==================== PASSWORD RESET ENDPOINTS ====================
  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response;
  },
};

// ==================== USER API ====================
export const userAPI = {
  
  getProfile: async () => {      
    const response = await api.get('/User/Profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const formData = new FormData();

    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });

    const response = await api.put('/User/Profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getApplications: async (page = 1, limit = 10) => {
    const response = await api.get('/User/Application', {
      params: { page, limit },
    });
    return response.data;
  },

  getInvitations: async (page = 1, limit = 10) => {
    const response = await api.get('/User/Invitation', {
      params: { page, limit },
    });
    return response.data;
  },

  getInvitationById: async (id) => {
    const response = await api.get(`/User/Invitation/${id}`);
    return response.data;
  },

  acceptInvitation: async (invitationId) => {
    const response = await api.post(`/User/Invitation/${invitationId}/accept`);
    return response.data;
  },

  rejectInvitation: async (invitationId) => {
    const response = await api.post(`/User/Invitation/${invitationId}/reject`);
    return response.data;
  },

  addExperience: async (experienceData) => {
    const formData = new FormData();

    Object.keys(experienceData).forEach((key) => {
      if (experienceData[key] !== null && experienceData[key] !== undefined) {
        formData.append(key, experienceData[key]);
      }
    });

    const response = await api.post('/User/Profile/Experience', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addSkill: async (formData) => {
    const response = await api.post(
      '/User/Profile/Skill',
      formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/User/Dashboard');
    return response.data;
  },

  getCompaniesWorked: async () => {
    const response = await api.get('/User/Dashboard/CompaniesWorked');
    return response.data;
  },
};

// ==================== COMPANY API ====================
export const companyAPI = {
  // ============ PROFILE MANAGEMENT ============
  getProfile: async () => {
    const response = await api.get('/Company/Profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const formData = new FormData();

    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });

    const response = await api.put('/Company/Profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ============ MANAGER MANAGEMENT ============
  getManagers: async () => {
    const response = await api.get('/Company/Profile/Managers');
    return response.data;
  },

  addManager: async (managerData) => {
    const formData = new FormData();
    
    Object.keys(managerData).forEach((key) => {
      if (managerData[key] !== null && managerData[key] !== undefined) {
        formData.append(key, managerData[key]);
      }
    });
    
    const response = await api.post('/Company/Manager', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ============ INVITATION MANAGEMENT ============
  createInvitation: async (invitationData) => {
    const response = await api.post('/Company/Invitations', invitationData);
    return response.data;
  },

  getInvitations: async (page = 1, limit = 10) => {
    const response = await api.get('/Company/Invitations', {
      params: { page, limit },
    });
    return response.data;
  },

  // ✅ FIXED: Delete invitation from Invitations table using Invitation_id
  deleteInvitation: async (invitationId) => {
    const response = await api.delete(`/Company/Invitations/${invitationId}`);
    return response.data;
  },

  // ============ APPLICANT/APPLICATION MANAGEMENT ============
  getApplicants: async (page = 1, limit = 10) => {
    const response = await api.get('/Company/Applicants', {
      params: { page, limit },
    });
    return response.data;
  },

  getApplicantById: async (id) => {
    const response = await api.get(`/Company/Applicants/${id}`);
    return response.data;
  },

  // ✅ FIXED: Accept application - Creates Job_Hiring_History entry
  acceptApplication: async (applicationId) => {
    console.warn('⚠️ acceptApplication is deprecated. Use acceptApplicant instead.');
    const response = await api.post(`/Company/Application/${applicationId}/accept`);
    return response.data;
  },

  // ✅ FIXED: Reject application - Updates status to Rejected
  rejectApplication: async (applicationId) => {
    console.warn('⚠️ rejectApplication is deprecated. Use deleteApplication instead.');
    const response = await api.post(`/Company/Application/${applicationId}/reject`);
    return response.data;
  },

  // ✅ NEW: Accept applicant with complete data for Job_Hiring_History
  acceptApplicant: async (data) => {
    const response = await api.post('/Company/Applicants/accept', {
      userId: Number(data.userId),
      jobId: Number(data.jobId),
      applicationId: Number(data.applicationId),
      jobName: data.jobName || "Position"
    });
    return response.data;
  },

  // ✅ FIXED: Delete application from Job_Applications table using Application_id
  deleteApplication: async (applicationId) => {
    const response = await api.delete(`/Company/Applications/${applicationId}`);
    return response.data;
  },

  // ============ JOB MANAGEMENT ============
  createJob: async (jobData) => {
    const response = await api.post('/Company/Jobs', jobData);
    return response.data;
  },

  getCompanyJobs: async () => {
    const response = await api.get('/Company/Jobs');
    return response.data;
  },

  getJobById: async (jobId) => {
    const response = await api.get(`/Company/Jobs/${jobId}`);
    return response.data;
  },

  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/Company/Jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/Company/Jobs/${jobId}`);
    return response.data;
  },

  // ============ DASHBOARD & STATS ============
  getDashboardStats: async () => {
    const response = await api.get('/Company/Dashboard');
    return response.data;
  },

  getUsersInChat: async () => {
    const response = await api.get('/Company/Dashboard/InChat');
    return response.data;
  },

  getHiredEmployees: async () => {
    const response = await api.get('/Company/Dashboard/HiredEmployees');
    return response.data;
  },

  // ============ HIRING MANAGEMENT ============
  hireUser: async (hireData) => {
    const response = await api.post('/Company/Hire', hireData);
    return response.data;
  },

  refuseUser: async (refuseData) => {
    const response = await api.post('/Company/RefuseUser', refuseData);
    return response.data;
  },

  // ============ JOB_HIRING_HISTORY MANAGEMENT ============
  getHiringHistory: async () => {
    const response = await api.get('/Company/HiringHistory');
    return response.data;
  },

  getHiringHistoryByUser: async (userId) => {
    const response = await api.get(`/Company/HiringHistory/User/${userId}`);
    return response.data;
  },

  updateHiringHistory: async (historyId, data) => {
    const response = await api.put(`/Company/HiringHistory/${historyId}`, data);
    return response.data;
  },

  deleteHiringHistory: async (historyId) => {
    const response = await api.delete(`/Company/HiringHistory/${historyId}`);
    return response.data;
  },

  // ============ NOTIFICATION MANAGEMENT ============
  getCompanyNotifications: async () => {
    const response = await api.get('/Company/Notifications');
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/Company/Notifications/${notificationId}/read`);
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/Company/Notifications/${notificationId}`);
    return response.data;
  }
};

// ==================== CHATBOT API ====================
export const chatbotAPI = {
  sendMessage: async (message, conversationHistory = []) => {
    const response = await api.post('/Chatbot/message', {
      message,
      conversationHistory
    });
    return response.data;
  },

  getSuggestions: async () => {
    const response = await api.get('/Chatbot/suggestions');
    return response.data;
  },
};

// ==================== GENERAL UPLOAD API ====================
export const uploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('Manager_Photo', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;