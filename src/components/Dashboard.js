import React, { useState, useEffect, useMemo } from 'react';
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
  FiMoreVertical,
  FiFolderPlus,
  FiClock,
  FiHardDrive,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { fileAPI, folderAPI } from '../services/api';
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
  const [activeTab, setActiveTab] = useState('all');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentView, setCurrentView] = useState('files'); // 'files' or 'starred'
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFiles();
  }, [navigate]);

  const fetchFiles = async (folderId = null) => {
    try {
      setLoading(true);
      const filesData = await fileAPI.getFiles(folderId);
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
        };

        const response = await fileAPI.uploadFile(file, onUploadProgress, currentFolderId);
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
      const item = files.find(f => f.id === fileId);
      if (!item) {
        alert('Item not found.');
        return;
      }
      
      if (item.isFolder) {
        await folderAPI.deleteFolder(fileId);
      } else {
        await fileAPI.deleteFile(fileId);
      }
      
      // Update local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
      
      // Refresh file list to ensure consistency
      await fetchFiles(currentFolderId);
      
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status === 400 && error.response?.data?.error?.includes('contents')) {
        alert('Cannot delete folder with contents. Please empty the folder first.');
      } else {
        alert('Failed to delete item. Please try again.');
      }
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

  // Bulk actions
  const bulkDownload = () => {
    selectedFiles.forEach((id) => {
      const f = files.find((x) => x.id === id);
      if (f && !f.isFolder) {
        downloadFile(f);
      }
    });
    
    const folderCount = selectedFiles.filter(id => {
      const f = files.find(x => x.id === id);
      return f?.isFolder;
    }).length;
    
    if (folderCount > 0) {
      alert(`${folderCount} folder(s) cannot be downloaded. Only files were downloaded.`);
    }
  };

  const bulkShare = async () => {
    const shareableFiles = selectedFiles
      .map((id) => files.find((x) => x.id === id))
      .filter(Boolean)
      .filter(f => !f.isFolder); // Only share files, not folders
    
    const urls = shareableFiles.map((f) => f.url).join('\n');
    
    if (urls) {
      await navigator.clipboard.writeText(urls);
      alert(`Copied ${shareableFiles.length} file link(s) to clipboard!`);
    } else {
      alert('No files selected for sharing. Folders cannot be shared directly.');
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;
    
    try {
      console.log('Starting bulk delete for:', selectedFiles);
      
      // Use the new bulk delete API
      const response = await fileAPI.bulkDelete(selectedFiles);
      
      console.log('Bulk delete response:', response);
      
      if (response.failureCount > 0) {
        const failedItems = response.results.filter(r => !r.success);
        const errorMessages = failedItems.map(item => item.error).join(', ');
        alert(`${response.successCount} item(s) deleted successfully. ${response.failureCount} item(s) failed: ${errorMessages}`);
      } else {
        console.log(`Successfully deleted ${response.successCount} item(s)`);
      }
      
      // Clear selection
      setSelectedFiles([]);
      
      // Refresh the file list to ensure consistency
      await fetchFiles(currentFolderId);
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete items. Please try again.');
      // Clear selection even on error to prevent stuck state
      setSelectedFiles([]);
    }
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
    if (file.isFolder) {
      alert('Cannot share folders directly');
      return;
    }
    navigator.clipboard.writeText(file.url);
    alert('File URL copied to clipboard!');
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      const response = await folderAPI.createFolder(newFolderName.trim(), currentFolderId);
      setFiles(prev => [response.folder, ...prev]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Create folder error:', error);
      alert(error.response?.data?.error || 'Failed to create folder');
    }
  };

  const openFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.folderName }]);
    fetchFiles(folder.id);
  };

  const navigateToFolder = (folderId, index) => {
    if (folderId === null) {
      // Navigate to root
      setCurrentFolderId(null);
      setFolderPath([]);
      fetchFiles(null);
    } else {
      // Navigate to specific folder
      setCurrentFolderId(folderId);
      setFolderPath(prev => prev.slice(0, index + 1));
      fetchFiles(folderId);
    }
  };

  const getItemIcon = (item) => {
    if (item.isFolder) return <FiFolder />;
    return getFileIcon(item.fileType);
  };

  const filteredFiles = useMemo(() => {
    let filtered = files;
    
    // Filter by current view (starred or all files)
    if (currentView === 'starred') {
      filtered = files.filter(item => item.isStarred);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const name = item.isFolder ? item.folderName : item.originalName;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return filtered;
  }, [files, searchQuery, currentView]);

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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
          <div
            className={`nav-item ${currentView === 'files' ? 'active' : ''}`}
            onClick={() => setCurrentView('files')}
          >
            <FiFolder />
            <span>My Files</span>
          </div>
          <div
            className={`nav-item ${currentView === 'starred' ? 'active' : ''}`}
            onClick={() => setCurrentView('starred')}
          >
            <FiStar />
            <span>Starred</span>
          </div>
          <div className="nav-item">
            <FiShare2 />
            <span>Shared</span>
          </div>
          <div className="nav-item">
            <FiClock />
            <span>Recent</span>
          </div>
          <div className="nav-item">
            <FiHardDrive />
            <span>Storage</span>
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
      </aside>

      {/* Main Content */}
      <main className="main-content">
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
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? <FiSun /> : <FiMoon />}
            </button>
            {currentView === 'files' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateFolder(true)}
              >
                <FiFolderPlus />
                New Folder
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Breadcrumb Navigation - Only show in files view */}
          {currentView === 'files' && folderPath.length > 0 && (
            <div className="breadcrumb">
              <button
                className="breadcrumb-item"
                onClick={() => navigateToFolder(null, -1)}
              >
                <FiHome /> Home
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className="breadcrumb-separator">/</span>
                  <button
                    className="breadcrumb-item"
                    onClick={() => navigateToFolder(folder.id, index)}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Upload Area - Only show in files view */}
          {currentView === 'files' && (
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
          )}

          {/* Files Section */}
          <div className="files-section">
            <div className="files-header">
              <div className="files-title">
                <h2>{currentView === 'starred' ? 'Starred Files' : 'My Files'}</h2>
                <span className="file-count">({filteredFiles.length} items)</span>
              </div>
              <div className="files-actions">
                {selectedFiles.length > 0 && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={bulkDownload}>
                      <FiDownload />
                      Download ({selectedFiles.length})
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={bulkShare}>
                      <FiShare2 />
                      Share ({selectedFiles.length})
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={bulkDelete}>
                      <FiTrash2 />
                      Delete ({selectedFiles.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {currentView === 'starred' && filteredFiles.length === 0 ? (
              <div className="empty-state">
                <FiStar className="empty-icon" />
                <h3>No starred files</h3>
                <p>Star your favorite files to see them here</p>
              </div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <FiFolder className="empty-icon" />
                <h3>No files yet</h3>
                <p>Upload your first file or create a folder to get started</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="empty-state">
                <FiSearch className="empty-icon" />
                <h3>No files found</h3>
                <p>Try adjusting your search terms</p>
              </div>
            ) : (
              <div className={`files-grid ${viewMode}`}>
                {filteredFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`file-item ${selectedFiles.includes(item.id) ? 'selected' : ''} ${item.isFolder ? 'folder-item' : ''}`}
                    onClick={() => item.isFolder ? openFolder(item) : toggleFileSelection(item.id)}
                    onDoubleClick={() => item.isFolder ? openFolder(item) : null}
                  >
                    <div className="file-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(item.id)}
                        onChange={() => toggleFileSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="file-icon">
                      {getItemIcon(item)}
                    </div>
                    
                    <div className="file-info">
                      <div className="file-name">
                        {item.isFolder ? item.folderName : item.originalName}
                      </div>
                      <div className="file-meta">
                        {item.isFolder ? (
                          <span className="file-type">Folder</span>
                        ) : (
                          <>
                            <span className="file-size">{formatFileSize(item.fileSize)}</span>
                            <span className="file-date">{formatDate(item.uploadDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="file-actions">
                      {!item.isFolder && (
                        <button
                          className={`star-btn ${item.isStarred ? 'starred' : ''}`}
                          aria-label={`${item.isStarred ? 'Unstar' : 'Star'} ${item.originalName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(item.id, item.isStarred);
                          }}
                        >
                          <FiStar />
                        </button>
                      )}
                      {!item.isFolder && (
                        <button
                          className="action-btn"
                          aria-label={`Download ${item.originalName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item);
                          }}
                        >
                          <FiDownload />
                        </button>
                      )}
                      <button
                        className="action-btn"
                        aria-label={`${item.isFolder ? 'Share folder' : 'Copy link for'} ${item.isFolder ? item.folderName : item.originalName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          shareFile(item);
                        }}
                      >
                        <FiShare2 />
                      </button>
                      <button
                        className="action-btn"
                        aria-label={`Delete ${item.isFolder ? item.folderName : item.originalName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.id);
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
      </main>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateFolder(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="folderName">Folder Name</label>
                <input
                  id="folderName"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateFolder(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={createFolder}
                disabled={!newFolderName.trim()}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;