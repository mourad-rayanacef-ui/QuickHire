import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor - handles 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accountType');
      window.location.href = '/SignIn'; // Changed from '/login' to '/SignIn'
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
 // ==================== PASSWORD RESET ENDPOINTS ====================
forgotPassword: async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
},

verifyResetToken: async (token) => {
  const response = await api.get(`/auth/verify-reset-token/${token}`);
  return response;  // ← Return full response, not just data
},

resetPassword: async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response;  // ← Return full response, not just data
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

  // ==================== AMINE BACKEND - USER DASHBOARD ====================
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

  createInvitation: async (invitationData) => {
    const response = await api.post('/Company/Invitation', invitationData);
    return response.data;
  },

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

  acceptApplication: async (applicationId) => {
    const response = await api.post(`/Company/Application/${applicationId}/accept`);
    return response.data;
  },

  rejectApplication: async (applicationId) => {
    const response = await api.post(`/Company/Application/${applicationId}/reject`);
    return response.data;
  },

  getInvitations: async (page = 1, limit = 10) => {
    const response = await api.get('/Company/Invitations', {
      params: { page, limit },
    });
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await api.delete(`/Company/Application/${id}`);
    return response.data;
  },

  deleteInvitation: async (id) => {
    const response = await api.delete(`/Company/Invitation/${id}`);
    return response.data;
  },

  // ==================== AMINE BACKEND - JOB POSTING ====================
  createJob: async (jobData) => {
    const response = await api.post('/Company/PostJob', jobData);
    return response.data;
  },

  // ==================== AMINE BACKEND - COMPANY DASHBOARD ====================
  getDashboardStats: async () => {
    const response = await api.get('/Company/Dashboard');
    return response.data;
  },

  getCompanyJobs: async () => {
    const response = await api.get('/Company/Dashboard/Jobs');
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

  hireUser: async (hireData) => {
    const response = await api.post('/Company/Dashboard/Hire', hireData);
    return response.data;
  },

  refuseUser: async (refuseData) => {
    const response = await api.post('/Company/Dashboard/RefuseUser', refuseData);
    return response.data;
  },
};

// ==================== CHATBOT API (AMINE BACKEND) ====================
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