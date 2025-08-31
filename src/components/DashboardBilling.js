import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiBox, 
  FiCheckCircle,
  FiActivity,
  FiFile,
  FiUpload,
  FiGlobe,
  FiDatabase,
  FiArchive,
  FiClock,
  FiTrendingUp,
  FiInfo
} from 'react-icons/fi';
import './DashboardBilling.css';

const DashboardBilling = () => {
  const [billingCycle, setBillingCycle] = useState('current_month');
  const [billingHistory, setBillingHistory] = useState([]);
  const [usageMetrics, setUsageMetrics] = useState(null);
  const [currentCosts, setCurrentCosts] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingStructure, setPricingStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // API call helper
  const apiCall = async (endpoint) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Fetch real billing data
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current usage data
      const usageData = await apiCall('/billing/usage');
      
      // Transform usage data to match UI expectations
      const transformedUsage = {
        storage: {
          classes: {},
          totalUsed: usageData.storage.totalUsed,
          totalCost: usageData.storage.totalCost
        },
        requests: {
          uploads: usageData.requests.uploads,
          downloads: usageData.requests.downloads,
          totalCost: usageData.requests.totalCost
        },
        transfer: {
          out: usageData.transfer.out,
          totalCost: usageData.transfer.totalCost
        },
        retrieval: {
          flexible_archive: usageData.retrieval.flexible_archive,
          deep_archive: usageData.retrieval.deep_archive,
          totalCost: usageData.retrieval.totalCost
        }
      };

      // Transform storage classes data
      Object.entries(usageData.storage.classes).forEach(([key, data]) => {
        const classKey = key.toLowerCase().replace('_', '_');
        transformedUsage.storage.classes[classKey] = data;
      });

      setUsageMetrics(transformedUsage);
      setPricingStructure(usageData.pricing);

      // Fetch current costs
      const currentData = await apiCall('/billing/current');
      setCurrentCosts(currentData);

      // Fetch billing history
      const historyData = await apiCall('/billing/history');
      setBillingHistory(historyData);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError(error.message);
      
      // Fallback to basic pricing structure if API fails
      setPricingStructure({
        storage: {
          standard: { name: 'Standard Storage', price: 0.03, description: 'Frequently accessed data' },
          ia: { name: 'Infrequent Access (IA)', price: 0.018, description: 'Less frequently accessed data' },
          archive_instant: { name: 'Archive Instant Retrieval', price: 0.006, description: 'Rarely accessed, instant retrieval' },
          flexible_archive: { name: 'Flexible Archive', price: 0.005, description: 'Minutes to hours retrieval' },
          deep_archive: { name: 'Deep Archive', price: 0.002, description: 'Up to 12 hours retrieval' }
        },
        requests: {
          uploads: { name: 'Uploads & Data Management', price: 0.05, unit: '1,000 requests' },
          downloads: { name: 'Downloads & Data Retrieval', price: 0.004, unit: '1,000 requests' }
        },
        transfer: {
          out: { name: 'Data Transfer Out', price: 0.10, freeAllowance: 10, description: 'First 10 GB free monthly' }
        },
        retrieval: {
          flexible_archive: { name: 'Flexible Archive Retrieval', price: 0.04 },
          deep_archive: { name: 'Deep Archive Retrieval', price: 0.03 }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatStorageSize = (sizeInGB) => {
    if (sizeInGB >= 1024) {
      return `${(sizeInGB / 1024).toFixed(2)} TB`;
    }
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const calculateTotalUsage = () => {
    if (!usageMetrics) return 0;
    return usageMetrics.storage.totalCost + 
           usageMetrics.requests.totalCost + 
           usageMetrics.transfer.totalCost + 
           usageMetrics.retrieval.totalCost;
  };

  if (loading) {
    return (
      <div className="dashboard-billing">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-billing">
        <div className="error-state">
          <p>Error loading billing data: {error}</p>
          <button className="btn btn-primary" onClick={fetchBillingData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-billing">
      {/* Billing Overview Header */}
      <div className="billing-header">
        <div className="current-plan-info">
          <h2>Pay-As-You-Go Billing</h2>
          <div className="plan-badge">Usage-Based</div>
          <div className="billing-cycle">
            Current month charges
            {pricingStructure && pricingStructure.margin && (
              <span className="margin-info"> • {pricingStructure.margin}% service margin</span>
            )}
          </div>
        </div>
        <div className="billing-actions">
          <button
            className="btn btn-outline"
            onClick={() => setShowPricing(!showPricing)}
          >
            <FiInfo /> View Pricing
          </button>
          <button className="btn btn-primary" onClick={fetchBillingData}>
            <FiDownload /> Refresh Data
          </button>
        </div>
      </div>

      {/* Current Costs Summary */}
      {currentCosts && (
        <div className="cost-summary">
          <h3>Cost Overview</h3>
          <div className="cost-cards">
            <div className="cost-card primary">
              <div className="cost-header">
                <FiTrendingUp />
                <span>Month to Date</span>
              </div>
              <div className="cost-amount">
                {formatCurrency(currentCosts.monthToDate)}
              </div>
              <div className="cost-detail">As of today</div>
            </div>
            
            <div className="cost-card">
              <div className="cost-header">
                <FiClock />
                <span>Projected Month End</span>
              </div>
              <div className="cost-amount">
                {formatCurrency(currentCosts.projectedMonthEnd)}
              </div>
              <div className="cost-detail">
                {currentCosts.trend === 'up' ? '↗️' : currentCosts.trend === 'down' ? '↘️' : '➡️'} 
                vs last month
              </div>
            </div>
            
            <div className="cost-card">
              <div className="cost-header">
                <FiActivity />
                <span>Last Month</span>
              </div>
              <div className="cost-amount">
                {formatCurrency(currentCosts.lastMonth)}
              </div>
              <div className="cost-detail">Previous billing cycle</div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Structure Modal */}
      {showPricing && pricingStructure && (
        <div className="pricing-modal">
          <div className="pricing-content">
            <div className="pricing-header">
              <h3>SkyCrate Pay-As-You-Go Pricing</h3>
              {pricingStructure.margin && (
                <div className="margin-notice">
                  Includes {pricingStructure.margin}% service margin over AWS costs
                </div>
              )}
              <button
                className="close-btn"
                onClick={() => setShowPricing(false)}
              >×</button>
            </div>
            
            <div className="pricing-sections">
              <div className="pricing-section">
                <h4><FiBox /> Storage Costs (per GB/month)</h4>
                {Object.entries(pricingStructure.storage).map(([key, storage]) => (
                  <div key={key} className="pricing-item">
                    <div className="pricing-name">
                      <strong>{storage.name}</strong>
                      <span className="pricing-desc">{storage.description}</span>
                    </div>
                    <div className="pricing-price">{formatCurrency(storage.price)}</div>
                  </div>
                ))}
              </div>

              <div className="pricing-section">
                <h4><FiUpload /> Request Costs</h4>
                {Object.entries(pricingStructure.requests).map(([key, request]) => (
                  <div key={key} className="pricing-item">
                    <div className="pricing-name">
                      <strong>{request.name}</strong>
                    </div>
                    <div className="pricing-price">{formatCurrency(request.price)} per {request.unit}</div>
                  </div>
                ))}
              </div>

              <div className="pricing-section">
                <h4><FiGlobe /> Data Transfer</h4>
                <div className="pricing-item">
                  <div className="pricing-name">
                    <strong>Data Transfer Out</strong>
                    <span className="pricing-desc">First 10 GB free monthly</span>
                  </div>
                  <div className="pricing-price">{formatCurrency(pricingStructure.transfer.out.price)} per GB</div>
                </div>
              </div>

              <div className="pricing-section">
                <h4><FiArchive /> Archive Retrieval</h4>
                {Object.entries(pricingStructure.retrieval).map(([key, retrieval]) => (
                  <div key={key} className="pricing-item">
                    <div className="pricing-name">
                      <strong>{retrieval.name}</strong>
                    </div>
                    <div className="pricing-price">{formatCurrency(retrieval.price)} per GB</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Usage Breakdown */}
      {usageMetrics && (
        <div className="usage-breakdown">
          <h3>Current Month Usage</h3>
          
          {/* Storage Usage */}
          <div className="usage-category">
            <div className="category-header">
              <FiDatabase />
              <div className="category-info">
                <h4>Storage by Class</h4>
                <span className="category-total">
                  {formatStorageSize(usageMetrics.storage.totalUsed)} • {formatCurrency(usageMetrics.storage.totalCost)}
                </span>
              </div>
            </div>
            <div className="usage-items">
              {Object.entries(usageMetrics.storage.classes).map(([key, storage]) => {
                // Map storage class keys to pricing structure
                const storageClassMap = {
                  'STANDARD': 'standard',
                  'STANDARD_IA': 'ia',
                  'GLACIER_IR': 'archive_instant',
                  'GLACIER': 'flexible_archive',
                  'DEEP_ARCHIVE': 'deep_archive'
                };
                
                const pricingKey = storageClassMap[key] || key.toLowerCase();
                const storageInfo = pricingStructure?.storage?.[pricingKey] ||
                                  { name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) };
                
                return (
                  <div key={key} className="usage-item">
                    <div className="usage-details">
                      <span className="usage-name">{storageInfo.name}</span>
                      <span className="usage-amount">{formatStorageSize(storage.used)}</span>
                    </div>
                    <div className="usage-cost">{formatCurrency(storage.cost)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Usage */}
          <div className="usage-category">
            <div className="category-header">
              <FiActivity />
              <div className="category-info">
                <h4>API Requests</h4>
                <span className="category-total">
                  {(usageMetrics.requests.uploads.count + usageMetrics.requests.downloads.count).toLocaleString()} requests • {formatCurrency(usageMetrics.requests.totalCost)}
                </span>
              </div>
            </div>
            <div className="usage-items">
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Uploads & Management</span>
                  <span className="usage-amount">{usageMetrics.requests.uploads.count.toLocaleString()} requests</span>
                </div>
                <div className="usage-cost">{formatCurrency(usageMetrics.requests.uploads.cost)}</div>
              </div>
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Downloads & Retrieval</span>
                  <span className="usage-amount">{usageMetrics.requests.downloads.count.toLocaleString()} requests</span>
                </div>
                <div className="usage-cost">{formatCurrency(usageMetrics.requests.downloads.cost)}</div>
              </div>
            </div>
          </div>

          {/* Data Transfer */}
          <div className="usage-category">
            <div className="category-header">
              <FiGlobe />
              <div className="category-info">
                <h4>Data Transfer Out</h4>
                <span className="category-total">
                  {formatStorageSize(usageMetrics.transfer.out.used)} • {formatCurrency(usageMetrics.transfer.totalCost)}
                </span>
              </div>
            </div>
            <div className="usage-items">
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Free Allowance Used</span>
                  <span className="usage-amount">{formatStorageSize(usageMetrics.transfer.out.freeUsed)} of 10 GB</span>
                </div>
                <div className="usage-cost">{formatCurrency(0)}</div>
              </div>
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Billable Transfer</span>
                  <span className="usage-amount">{formatStorageSize(usageMetrics.transfer.out.billableUsed)}</span>
                </div>
                <div className="usage-cost">{formatCurrency(usageMetrics.transfer.out.cost)}</div>
              </div>
            </div>
          </div>

          {/* Archive Retrieval */}
          <div className="usage-category">
            <div className="category-header">
              <FiArchive />
              <div className="category-info">
                <h4>Archive Retrieval</h4>
                <span className="category-total">
                  {formatStorageSize(usageMetrics.retrieval.flexible_archive.used + usageMetrics.retrieval.deep_archive.used)} • {formatCurrency(usageMetrics.retrieval.totalCost)}
                </span>
              </div>
            </div>
            <div className="usage-items">
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Flexible Archive</span>
                  <span className="usage-amount">{formatStorageSize(usageMetrics.retrieval.flexible_archive.used)}</span>
                </div>
                <div className="usage-cost">{formatCurrency(usageMetrics.retrieval.flexible_archive.cost)}</div>
              </div>
              <div className="usage-item">
                <div className="usage-details">
                  <span className="usage-name">Deep Archive</span>
                  <span className="usage-amount">{formatStorageSize(usageMetrics.retrieval.deep_archive.used)}</span>
                </div>
                <div className="usage-cost">{formatCurrency(usageMetrics.retrieval.deep_archive.cost)}</div>
              </div>
            </div>
          </div>

          {/* Total Usage */}
          <div className="usage-total">
            <div className="total-label">Total Current Month Usage</div>
            <div className="total-amount">{formatCurrency(calculateTotalUsage())}</div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="billing-history">
        <h3>Billing History</h3>
        <div className="history-table">
          <div className="table-header">
            <div>Period</div>
            <div>Storage</div>
            <div>Requests</div>
            <div>Transfer</div>
            <div>Retrieval</div>
            <div>Total</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {billingHistory.map((bill) => (
            <div key={bill.id} className="table-row">
              <div>
                <strong>{bill.period}</strong>
                <div className="bill-date">{formatDate(bill.date)}</div>
              </div>
              <div>{formatCurrency(bill.breakdown.storage)}</div>
              <div>{formatCurrency(bill.breakdown.requests)}</div>
              <div>{formatCurrency(bill.breakdown.transfer)}</div>
              <div>{formatCurrency(bill.breakdown.retrieval)}</div>
              <div><strong>{formatCurrency(bill.total)}</strong></div>
              <div>
                <span className={`status-badge ${bill.status}`}>
                  {bill.status}
                </span>
              </div>
              <div>
                <button className="btn btn-icon" title="Download Invoice">
                  <FiDownload />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Optimization Tips */}
      <div className="cost-tips">
        <h3>Cost Optimization Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <FiDatabase />
            <h4>Optimize Storage Classes</h4>
            <p>Move infrequently accessed files to Archive storage classes to save up to 92% on storage costs.</p>
          </div>
          <div className="tip-card">
            <FiArchive />
            <h4>Archive Old Files</h4>
            <p>Use Deep Archive for files accessed once or twice per year to minimize long-term storage costs.</p>
          </div>
          <div className="tip-card">
            <FiGlobe />
            <h4>Monitor Data Transfer</h4>
            <p>Keep track of your data transfer usage to avoid unexpected charges beyond the 10 GB free tier.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBilling;
