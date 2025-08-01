import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  FiUpload, 
  FiFile, 
  FiImage, 
  FiVideo, 
  FiMusic, 
  FiArchive,
  FiTrash2,
  FiDownload,
  FiShare2,
  FiHome,
  FiFolder,
  FiStar,
  FiSettings,
  FiUser,
  FiSearch,
  FiGrid,
  FiList,
  FiMenu,
  FiX,
  FiPlus,
  FiLogOut,
  FiMoreVertical
} from 'react-icons/fi';
import { fileAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFiles();
  }, [navigate]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const filesData = await fileAPI.getFiles();
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // You can add progress tracking here if needed
        };

        const response = await fileAPI.uploadFile(file, onUploadProgress);
        
        // Add the new file to the files list
        setFiles(prev => [response.file, ...prev]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <FiImage />;
    if (fileType.startsWith('video/')) return <FiVideo />;
    if (fileType.startsWith('audio/')) return <FiMusic />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <FiArchive />;
    return <FiFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const removeFile = async (fileId) => {
    try {
      await fileAPI.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const toggleStar = async (fileId, currentStarred) => {
    try {
      const response = await fileAPI.toggleStar(fileId, currentStarred);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, isStarred: response.isStarred } : f
      ));
    } catch (error) {
      console.error('Star error:', error);
      alert('Failed to update file star status.');
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareFile = (file) => {
    navigator.clipboard.writeText(file.url);
    alert('File URL copied to clipboard!');
  };

  const filteredFiles = files.filter(file => 
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    }
  });

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FiFolder />
            <span>SkyCrate</span>
          </div>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <FiHome />
            <span>Home</span>
          </Link>
          <div className="nav-item active">
            <FiFolder />
            <span>My Files</span>
          </div>
          <div className="nav-item">
            <FiStar />
            <span>Starred</span>
          </div>
          <div className="nav-item">
            <FiShare2 />
            <span>Shared</span>
          </div>
          <div className="nav-item">
            <FiSettings />
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-email">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu />
            </button>
            <div className="search-bar">
              <FiSearch />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="header-right">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <FiList />
              </button>
            </div>
            <button className="btn btn-primary">
              <FiPlus />
              New Folder
            </button>
          </div>
        </header>

        {/* Upload Area */}
        <div className="upload-section">
          <div 
            {...getRootProps()} 
            className={`upload-area ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <FiUpload className="upload-icon" />
            {isDragActive ? (
              <p>Drop files here to upload</p>
            ) : (
              <div>
                <p>Drag and drop files here, or click to select files</p>
                <button className="btn btn-secondary">Choose Files</button>
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="files-section">
          <div className="files-header">
            <h2>My Files ({files.length})</h2>
            <div className="files-actions">
              {selectedFiles.length > 0 && (
                <>
                  <button className="btn btn-secondary">
                    <FiDownload />
                    Download ({selectedFiles.length})
                  </button>
                  <button className="btn btn-secondary">
                    <FiShare2 />
                    Share ({selectedFiles.length})
                  </button>
                  <button className="btn btn-secondary">
                    <FiTrash2 />
                    Delete ({selectedFiles.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <FiFolder className="empty-icon" />
              <h3>No files yet</h3>
              <p>Upload your first file to get started</p>
            </div>
          ) : (
            <div className={`files-grid ${viewMode}`}>
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="file-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="file-icon">
                    {getFileIcon(file.fileType)}
                  </div>
                  
                  <div className="file-info">
                    <div className="file-name">{file.originalName}</div>
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(file.fileSize)}</span>
                      <span className="file-date">{formatDate(file.uploadDate)}</span>
                    </div>
                  </div>
                  
                  <div className="file-actions">
                    <button 
                      className={`star-btn ${file.isStarred ? 'starred' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(file.id, file.isStarred);
                      }}
                    >
                      <FiStar />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                    >
                      <FiDownload />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareFile(file);
                      }}
                    >
                      <FiShare2 />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 