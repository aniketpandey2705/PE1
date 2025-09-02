import React, { useState, useEffect } from 'react';
import { FiX, FiLink, FiClock, FiCheck, FiCopy, FiAlertCircle, FiShare2 } from 'react-icons/fi';
import { fileAPI } from '../services/api';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, fileDetails, onAddSharedFile, onUpdateSharedFileUrl, existingSharedFiles = [] }) => {
  const [expiryTime, setExpiryTime] = useState('7d'); // Default 7 days
  const [customTime, setCustomTime] = useState({ value: '', unit: 'h' });
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  // Check if file is already shared
  const existingSharedFile = existingSharedFiles.find(file => file.id === fileDetails?.id);
  const isAlreadyShared = !!existingSharedFile;

  const convertToSeconds = (time, unit) => {
    const unitToSeconds = {
      h: 3600,      // 1 hour = 3600 seconds
      d: 86400,     // 1 day = 86400 seconds
      w: 604800,    // 1 week = 604800 seconds
      m: 2592000,   // 1 month (30 days) = 2592000 seconds
    };
    return Math.floor(time * unitToSeconds[unit]);
  };

  const handleCustomTimeChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setCustomTime(prev => ({ ...prev, value }));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy URL');
    }
  };

  const generateShareUrl = async () => {
    setIsLoading(true);
    try {
      let expirySeconds;

      if (expiryTime === 'custom') {
        if (!customTime.value) {
          throw new Error('Please enter a valid time value');
        }
        expirySeconds = convertToSeconds(parseInt(customTime.value), customTime.unit);
      } else {
        const expiryMap = {
          '1h': 3600,
          '24h': 86400,
          '7d': 604800,
          '30d': 2592000
        };
        expirySeconds = expiryMap[expiryTime];
      }

      const { url } = await fileAPI.generateShareUrl(fileDetails.id, expirySeconds);
      if (!url) throw new Error('No URL in response');
      setShareUrl(url);

      // Add file to global shared files context
      if (onAddSharedFile) {
        onAddSharedFile(fileDetails, expirySeconds);
      }

      // Update the share URL in context
      if (onUpdateSharedFileUrl) {
        onUpdateSharedFileUrl(fileDetails.id, url);
      }

      // Add file to local shared files list for modal display
      const expiryTimestamp = Date.now() + expirySeconds * 1000;
      setSharedFiles(prev => [...prev, { ...fileDetails, expiryTimestamp }]);
      setTimeLeft(expirySeconds);
    } catch (error) {
      console.error('Share URL generation error:', error);
      alert(error.message || error.response?.data?.message || 'Failed to generate share URL');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!timeLeft) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share File</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-content">
          {isAlreadyShared && !shareUrl && (
            <div className="existing-share-notice">
              <div className="notice-header">
                <FiShare2 />
                <span>This file is already shared</span>
              </div>
              <div className="existing-share-details">
                <p><strong>Current expiry:</strong> {existingSharedFile.expiryTimestamp ? new Date(existingSharedFile.expiryTimestamp).toLocaleString() : 'No expiry'}</p>
                {existingSharedFile.shareUrl && (
                  <p><strong>Share URL:</strong> <a href={existingSharedFile.shareUrl} target="_blank" rel="noopener noreferrer">View Link</a></p>
                )}
                <p>You can generate a new share link with different expiry time below.</p>
              </div>
            </div>
          )}

          {sharedFiles.length > 0 && (
            <div className="shared-files-section">
              <h3><FiShare2 /> Shared Files</h3>
              <div className="shared-files-list">
                {sharedFiles.map((file, index) => (
                  <div key={index} className="shared-file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="time-left">
                      {timeLeft ? `Expires in ${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m` : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareUrl ? (
            <div className="share-url-container">
              <p className="expiry-note">
                Link will expire in {expiryTime === 'custom' 
                  ? `${customTime.value} ${customTime.unit === 'h' ? 'hours' 
                    : customTime.unit === 'd' ? 'days'
                    : customTime.unit === 'w' ? 'weeks'
                    : 'months'}`
                  : expiryTime}
              </p>
              <div className="share-url">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  onClick={e => e.target.select()} 
                />
                <button 
                  className="copy-button" 
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  {isCopied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="expiry-selector">
                <label>
                  <FiClock />
                  Select expiry time:
                </label>
                <select 
                  value={expiryTime} 
                  onChange={(e) => setExpiryTime(e.target.value)}
                >
                  <option value="1h">1 hour</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="custom">Custom time</option>
                </select>
              </div>
              
              {expiryTime === 'custom' && (
                <div className="custom-time">
                  <input
                    type="text"
                    placeholder="Enter value"
                    value={customTime.value}
                    onChange={handleCustomTimeChange}
                    className="custom-time-input"
                  />
                  <select
                    value={customTime.unit}
                    onChange={(e) => setCustomTime(prev => ({ ...prev, unit: e.target.value }))}
                    className="custom-time-unit"
                  >
                    <option value="h">Hours</option>
                    <option value="d">Days</option>
                    <option value="w">Weeks</option>
                    <option value="m">Months</option>
                  </select>
                </div>
              )}

              <button 
                className="generate-button"
                onClick={generateShareUrl}
                disabled={isLoading || (expiryTime === 'custom' && !customTime.value)}
              >
                {isLoading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
