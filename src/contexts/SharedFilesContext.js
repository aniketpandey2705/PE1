import React, { createContext, useContext, useState, useEffect } from 'react';

const SharedFilesContext = createContext();

export const useSharedFiles = () => {
  const context = useContext(SharedFilesContext);
  if (!context) {
    throw new Error('useSharedFiles must be used within a SharedFilesProvider');
  }
  return context;
};

export const SharedFilesProvider = ({ children }) => {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Load shared files from backend on mount
  useEffect(() => {
    const loadSharedFiles = async () => {
      try {
        setIsLoading(true);
        const data = await apiCall('/shared-files');
        setSharedFiles(data);
      } catch (error) {
        console.error('Error loading shared files from backend:', error);
        // Fallback to empty array if API fails
        setSharedFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    const token = getAuthToken();
    if (token) {
      loadSharedFiles();
    } else {
      setIsLoading(false);
    }
  }, []);

  const addSharedFile = async (file, expirySeconds) => {
    try {
      const data = await apiCall('/shared-files', {
        method: 'POST',
        body: JSON.stringify({
          fileId: file.id,
          expirySeconds,
          shareUrl: file.shareUrl || ''
        })
      });

      setSharedFiles(prev => {
        // Check if file is already shared, update if so
        const existingIndex = prev.findIndex(f => f.id === file.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        }
        return [data, ...prev];
      });

      return data;
    } catch (error) {
      console.error('Error adding shared file:', error);
      throw error;
    }
  };

  const updateSharedFileUrl = async (fileId, shareUrl) => {
    try {
      const data = await apiCall(`/shared-files/${fileId}/url`, {
        method: 'PATCH',
        body: JSON.stringify({ shareUrl })
      });

      setSharedFiles(prev =>
        prev.map(file =>
          file.id === fileId ? data : file
        )
      );

      return data;
    } catch (error) {
      console.error('Error updating shared file URL:', error);
      throw error;
    }
  };

  const removeSharedFile = async (fileId) => {
    try {
      await apiCall(`/shared-files/${fileId}`, {
        method: 'DELETE'
      });

      setSharedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error removing shared file:', error);
      throw error;
    }
  };

  const clearExpiredFiles = async () => {
    try {
      await apiCall('/shared-files/expired', {
        method: 'DELETE'
      });

      // Reload shared files after clearing expired ones
      const data = await apiCall('/shared-files');
      setSharedFiles(data);
    } catch (error) {
      console.error('Error clearing expired files:', error);
      throw error;
    }
  };

  const value = {
    sharedFiles,
    isLoading,
    addSharedFile,
    updateSharedFileUrl,
    removeSharedFile,
    clearExpiredFiles
  };

  return (
    <SharedFilesContext.Provider value={value}>
      {children}
    </SharedFilesContext.Provider>
  );
};
