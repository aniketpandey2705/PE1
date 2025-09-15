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
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
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

  // Load shared files from backend
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

  // Load shared files on mount and when user changes
  useEffect(() => {
    const token = getAuthToken();
    const userId = getCurrentUserId();
    
    if (token && userId) {
      // Check if user has changed
      if (currentUserId !== userId) {
        console.log('User changed, reloading shared files:', { from: currentUserId, to: userId });
        setCurrentUserId(userId);
        setSharedFiles([]); // Clear previous user's data immediately
        loadSharedFiles();
      } else if (currentUserId === userId && sharedFiles.length === 0) {
        // Same user but no data loaded yet
        loadSharedFiles();
      }
    } else {
      // No token or user - clear everything
      setCurrentUserId(null);
      setSharedFiles([]);
      setIsLoading(false);
    }
  }, [currentUserId]); // Re-run when currentUserId changes

  // Monitor for user/token changes
  useEffect(() => {
    const checkUserChange = () => {
      const userId = getCurrentUserId();
      const token = getAuthToken();
      
      if (!token || !userId) {
        // User logged out
        if (currentUserId !== null) {
          console.log('User logged out, clearing shared files');
          setCurrentUserId(null);
          setSharedFiles([]);
          setIsLoading(false);
        }
      } else if (currentUserId !== userId) {
        // User changed
        console.log('User changed detected:', { from: currentUserId, to: userId });
        setCurrentUserId(userId);
      }
    };

    // Check immediately
    checkUserChange();

    // Set up interval to check for changes (in case of manual localStorage changes)
    const interval = setInterval(checkUserChange, 1000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  const addSharedFile = async (file, expirySeconds) => {
    try {
      console.log(`🔗 Generating AWS presigned URL for file: ${file.originalName}`);
      console.log(`⏰ Expiry: ${expirySeconds ? `${expirySeconds}s` : 'Default (1 hour)'}`);
      
      const data = await apiCall('/shared-files', {
        method: 'POST',
        body: JSON.stringify({
          fileId: file.id,
          expirySeconds
        })
      });

      console.log(`✅ AWS presigned URL generated: ${data.shareUrl}`);

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
      console.error('Error generating AWS share URL:', error);
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
      await loadSharedFiles();
    } catch (error) {
      console.error('Error clearing expired files:', error);
      throw error;
    }
  };

  const refreshSharedFiles = async () => {
    await loadSharedFiles();
  };

  const clearSharedFilesCache = () => {
    setSharedFiles([]);
    setCurrentUserId(null);
    setIsLoading(false);
  };

  const value = {
    sharedFiles,
    isLoading,
    addSharedFile,
    updateSharedFileUrl,
    removeSharedFile,
    clearExpiredFiles,
    refreshSharedFiles,
    clearSharedFilesCache,
    currentUserId
  };

  return (
    <SharedFilesContext.Provider value={value}>
      {children}
    </SharedFilesContext.Provider>
  );
};
