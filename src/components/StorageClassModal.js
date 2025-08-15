import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiDollarSign, FiClock, FiInfo } from 'react-icons/fi';
import { fileAPI } from '../services/api';
import './StorageClassModal.css';

const StorageClassModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  file,
  loading = false 
}) => {
  const [recommendations, setRecommendations] = useState(null);
  const [selectedStorageClass, setSelectedStorageClass] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchRecommendations = async () => {
    if (!file) return;
    
    setLoadingRecommendations(true);
    try {
      const data = await fileAPI.getStorageRecommendations(
        file.name,
        file.type,
        file.size
      );
      setRecommendations(data);
      setSelectedStorageClass(data.recommendation.recommended);
    } catch (error) {
      console.error('Error fetching storage recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (isOpen && file) {
      fetchRecommendations();
    }
  }, [isOpen, file]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = () => {
    if (selectedStorageClass) {
      onSelect(selectedStorageClass);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCost = (cost) => {
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="storage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Choose Storage Class</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {file && (
            <div className="file-info">
              <h4>File: {file.name}</h4>
              <p>Size: {formatFileSize(file.size)} • Type: {file.type}</p>
            </div>
          )}

          {loadingRecommendations ? (
            <div className="loading-recommendations">
              <div className="loading-spinner"></div>
              <p>Getting recommendations...</p>
            </div>
          ) : recommendations ? (
            <>
              {recommendations.showRecommendations && (
                <div className="recommendation-banner">
                  <FiInfo />
                  <div>
                    <strong>Recommended: {recommendations.storageClasses.find(sc => sc.name === recommendations.recommendation.recommended)?.displayName}</strong>
                    <p>{recommendations.recommendation.reason}</p>
                  </div>
                </div>
              )}

              <div className="storage-classes">
                {recommendations.storageClasses.map((storageClass) => (
                  <div
                    key={storageClass.name}
                    className={`storage-class-option ${
                      selectedStorageClass === storageClass.name ? 'selected' : ''
                    } ${
                      recommendations.recommendation.recommended === storageClass.name ? 'recommended' : ''
                    }`}
                    onClick={() => setSelectedStorageClass(storageClass.name)}
                  >
                    <div className="storage-class-header">
                      <div className="storage-class-name">
                        <input
                          type="radio"
                          name="storageClass"
                          value={storageClass.name}
                          checked={selectedStorageClass === storageClass.name}
                          onChange={() => setSelectedStorageClass(storageClass.name)}
                        />
                        <span className="name">{storageClass.displayName}</span>
                        {recommendations.recommendation.recommended === storageClass.name && (
                          <span className="recommended-badge">
                            <FiCheck /> Recommended
                          </span>
                        )}
                      </div>
                      <div className="storage-class-cost">
                        <FiDollarSign />
                        {formatCost(storageClass.estimatedMonthlyCost)}/month
                      </div>
                    </div>
                    
                    <div className="storage-class-details">
                      <p className="description">{storageClass.description}</p>
                      <div className="storage-class-specs">
                        <span className="spec">
                          <FiClock /> {storageClass.retrievalTime}
                        </span>
                        {storageClass.minimumDuration !== 'None' && (
                          <span className="spec">
                            Min: {storageClass.minimumDuration}
                          </span>
                        )}
                        {storageClass.savingsVsStandard > 0 && (
                          <span className="savings">
                            {storageClass.savingsVsStandard}% savings
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="error-state">
              <p>Unable to load storage class options. Please try again.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSelect}
            disabled={!selectedStorageClass || loading}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageClassModal;