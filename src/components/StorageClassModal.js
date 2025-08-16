import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiDollarSign, FiClock, FiInfo, FiHardDrive } from 'react-icons/fi';
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
  const [selectedStorageSize, setSelectedStorageSize] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Real AWS S3 pricing per GB per month (as of 2024)
  const STORAGE_PRICING = {
    STANDARD: {
      pricePerGB: 0.023,
      displayName: 'Standard',
      description: 'Frequently accessed data with immediate retrieval',
      retrievalTime: 'Immediate',
      minimumDuration: 'None',
      savingsVsStandard: 0
    },
    STANDARD_IA: {
      pricePerGB: 0.0125,
      displayName: 'Standard-IA',
      description: 'Infrequently accessed data with immediate retrieval',
      retrievalTime: 'Immediate',
      minimumDuration: '30 days',
      savingsVsStandard: 46
    },
    ONEZONE_IA: {
      pricePerGB: 0.01,
      displayName: 'One Zone-IA',
      description: 'Infrequently accessed data in single AZ',
      retrievalTime: 'Immediate',
      minimumDuration: '30 days',
      savingsVsStandard: 57
    },
    GLACIER_IR: {
      pricePerGB: 0.004,
      displayName: 'Glacier Instant Retrieval',
      description: 'Archive data with immediate retrieval',
      retrievalTime: 'Immediate',
      minimumDuration: '90 days',
      savingsVsStandard: 83
    },
    GLACIER: {
      pricePerGB: 0.0036,
      displayName: 'Glacier',
      description: 'Long-term archive with 1-5 minute retrieval',
      retrievalTime: '1-5 minutes',
      minimumDuration: '90 days',
      savingsVsStandard: 84
    },
    DEEP_ARCHIVE: {
      pricePerGB: 0.00099,
      displayName: 'Deep Archive',
      description: 'Long-term backup with 12-hour retrieval',
      retrievalTime: '12 hours',
      minimumDuration: '180 days',
      savingsVsStandard: 96
    }
  };

  // Storage size options in GB
  const STORAGE_SIZE_OPTIONS = [
    { value: 1, label: '1 GB', description: 'Small files, documents' },
    { value: 5, label: '5 GB', description: 'Medium files, photos' },
    { value: 10, label: '10 GB', description: 'Large files, videos' },
    { value: 25, label: '25 GB', description: 'HD videos, datasets' },
    { value: 50, label: '50 GB', description: '4K videos, large datasets' },
    { value: 100, label: '100 GB', description: 'Enterprise datasets' },
    { value: 250, label: '250 GB', description: 'Large backups' },
    { value: 500, label: '500 GB', description: 'Enterprise backups' },
    { value: 1000, label: '1 TB', description: 'Large archives' }
  ];

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
      
      // Set default storage size based on file size
      const fileSizeGB = file.size / (1024 * 1024 * 1024);
      const closestSize = STORAGE_SIZE_OPTIONS.reduce((prev, curr) => 
        Math.abs(curr.value - fileSizeGB) < Math.abs(prev.value - fileSizeGB) ? curr : prev
      );
      setSelectedStorageSize(closestSize.value);
    } catch (error) {
      console.error('Error fetching storage recommendations:', error);
      // Set default values if API fails
      setSelectedStorageClass('STANDARD');
      setSelectedStorageSize(1);
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
    if (selectedStorageClass && selectedStorageSize) {
      onSelect({
        storageClass: selectedStorageClass,
        storageSize: selectedStorageSize,
        estimatedMonthlyCost: calculateMonthlyCost(selectedStorageClass, selectedStorageSize)
      });
    }
  };

  const calculateMonthlyCost = (storageClass, sizeGB) => {
    const pricing = STORAGE_PRICING[storageClass];
    return pricing ? pricing.pricePerGB * sizeGB : 0;
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
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const getStorageClassIcon = (storageClass) => {
    switch (storageClass) {
      case 'STANDARD':
        return '🔵';
      case 'STANDARD_IA':
        return '🟡';
      case 'ONEZONE_IA':
        return '🟠';
      case 'GLACIER_IR':
        return '🟢';
      case 'GLACIER':
        return '🟣';
      case 'DEEP_ARCHIVE':
        return '⚫';
      default:
        return '📁';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="storage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Choose Storage Class & Size</h3>
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

          {/* Storage Size Selection */}
          <div className="storage-size-section">
            <h4>Select Storage Size</h4>
            <div className="storage-size-options">
              {STORAGE_SIZE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`storage-size-option ${
                    selectedStorageSize === option.value ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedStorageSize(option.value)}
                >
                  <div className="size-option-header">
                    <input
                      type="radio"
                      name="storageSize"
                      value={option.value}
                      checked={selectedStorageSize === option.value}
                      onChange={() => setSelectedStorageSize(option.value)}
                    />
                    <span className="size-label">{option.label}</span>
                    <span className="size-description">{option.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {loadingRecommendations ? (
            <div className="loading-recommendations">
              <div className="loading-spinner"></div>
              <p>Getting recommendations...</p>
            </div>
          ) : (
            <>
              {recommendations?.showRecommendations && (
                <div className="recommendation-banner">
                  <FiInfo />
                  <div>
                    <strong>Recommended: {STORAGE_PRICING[recommendations.recommendation.recommended]?.displayName}</strong>
                    <p>{recommendations.recommendation.reason}</p>
                  </div>
                </div>
              )}

              <div className="storage-classes">
                {Object.entries(STORAGE_PRICING).map(([storageClass, pricing]) => {
                  const monthlyCost = calculateMonthlyCost(storageClass, selectedStorageSize || 1);
                  const isSelected = selectedStorageClass === storageClass;
                  const isRecommended = recommendations?.recommendation?.recommended === storageClass;
                  
                  return (
                    <div
                      key={storageClass}
                      className={`storage-class-option ${
                        isSelected ? 'selected' : ''
                      } ${
                        isRecommended ? 'recommended' : ''
                      }`}
                      onClick={() => setSelectedStorageClass(storageClass)}
                    >
                      <div className="storage-class-header">
                        <div className="storage-class-name">
                          <input
                            type="radio"
                            name="storageClass"
                            value={storageClass}
                            checked={isSelected}
                            onChange={() => setSelectedStorageClass(storageClass)}
                          />
                          <span className="storage-icon">{getStorageClassIcon(storageClass)}</span>
                          <span className="name">{pricing.displayName}</span>
                          {isRecommended && (
                            <span className="recommended-badge">
                              <FiCheck /> Recommended
                            </span>
                          )}
                        </div>
                        <div className="storage-class-cost">
                          <FiDollarSign />
                          {formatCost(monthlyCost)}/month
                        </div>
                      </div>
                      
                      <div className="storage-class-details">
                        <p className="description">{pricing.description}</p>
                        <div className="storage-class-specs">
                          <span className="spec">
                            <FiClock /> {pricing.retrievalTime}
                          </span>
                          {pricing.minimumDuration !== 'None' && (
                            <span className="spec">
                              Min: {pricing.minimumDuration}
                            </span>
                          )}
                          {pricing.savingsVsStandard > 0 && (
                            <span className="savings">
                              {pricing.savingsVsStandard}% savings
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Summary */}
              {selectedStorageClass && selectedStorageSize && (
                <div className="cost-summary">
                  <h4>Cost Summary</h4>
                  <div className="cost-breakdown">
                    <div className="cost-item">
                      <span>Storage Class:</span>
                      <span>{STORAGE_PRICING[selectedStorageClass].displayName}</span>
                    </div>
                    <div className="cost-item">
                      <span>Storage Size:</span>
                      <span>{selectedStorageSize} GB</span>
                    </div>
                    <div className="cost-item total">
                      <span>Monthly Cost:</span>
                      <span>{formatCost(calculateMonthlyCost(selectedStorageClass, selectedStorageSize))}</span>
                    </div>
                    <div className="cost-item">
                      <span>Annual Cost:</span>
                      <span>{formatCost(calculateMonthlyCost(selectedStorageClass, selectedStorageSize) * 12)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSelect}
            disabled={!selectedStorageClass || !selectedStorageSize || loading}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageClassModal;