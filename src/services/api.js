import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || '';

    // Unauthorized or invalid token -> clear and redirect to login
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        window.location.href = '/login';
      }
      return; // stop further handling
    }

    // Bucket deleted/missing cases from server -> clear and redirect to register
    if (status === 404 && /bucket/i.test(message)) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        window.location.href = '/register';
      }
      return;
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
};

// File management API
export const fileAPI = {
  // Get storage class recommendations
  getStorageRecommendations: async (fileName, fileType, fileSize) => {
    const response = await api.post('/storage/recommendations', {
      fileName,
      fileType,
      fileSize
    });
    return response.data;
  },

  // Upload file with optional storage class
  uploadFile: async (file, onUploadProgress, parentFolderId = null, storageClass = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentFolderId) {
      formData.append('parentFolderId', parentFolderId);
    }
    if (storageClass) {
      formData.append('storageClass', storageClass);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Get user files
  getFiles: async (folderId = null) => {
    const params = folderId ? { folderId } : {};
    const response = await api.get('/files', { params });
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  // Bulk delete files/folders
  bulkDelete: async (fileIds) => {
    const response = await api.delete('/files/bulk', { data: { fileIds } });
    return response.data;
  },

  // Toggle star file
  toggleStar: async (fileId, isStarred) => {
    const response = await api.patch(`/files/${fileId}/star`, { isStarred });
    return response.data;
  },
};

// Folder management API
export const folderAPI = {
  // Create folder
  createFolder: async (folderName, parentFolderId = null) => {
    const response = await api.post('/folders', { folderName, parentFolderId });
    return response.data;
  },

  // Get folders
  getFolders: async () => {
    const response = await api.get('/folders');
    return response.data;
  },

  // Delete folder
  deleteFolder: async (folderId) => {
    const response = await api.delete(`/folders/${folderId}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api; 