import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCloud, 
  FiShield, 
  FiZap, 
  FiSmartphone, 
  FiUsers, 
  FiLock,
  FiArrowRight,
  FiCheck,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiAward,
  FiGlobe,
  FiServer
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import './LandingPage.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="nav-logo">
              <FiCloud className="logo-icon" />
              <span className="logo-text">SkyCrate</span>
            </div>
            
            <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
              <a href="#cost-savings" onClick={() => setMobileMenuOpen(false)}>Cost Savings</a>
              <a href="#storage-classes" onClick={() => setMobileMenuOpen(false)}>Storage Classes</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </div>
            
            <div className="nav-actions">
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              >
                {isDark ? <FiSun /> : <FiMoon />}
              </button>
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="trust-badge">
                <FiShield />
                <span>AWS S3 Optimized Storage</span>
              </div>
              <h1 className="hero-title">
                Optimize your cloud storage costs with <span className="text-primary">SkyCrate</span>
              </h1>
              <p className="hero-subtitle">
                Pay-as-you-go billing with automatic AWS S3 storage class optimization for maximum savings and performance.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Free Trial
                  <FiArrowRight />
                </Link>
                <button className="btn btn-ghost btn-lg">
                  Watch Demo
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">46%</span>
                  <span className="stat-label">Cost Savings on Large Videos</span>
                </div>
                <div className="stat">
                  <span className="stat-number">84%</span>
                  <span className="stat-label">Savings on Archive Files</span>
                </div>
                <div className="stat">
                  <span className="stat-number">30%</span>
                  <span className="stat-label">Platform Margin</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-elements">
                <div className="floating-card card-1">
                  <FiShield />
                  <span>Secure</span>
                </div>
                <div className="floating-card card-2">
                  <FiServer />
                  <span>Reliable</span>
                </div>
                <div className="floating-card card-3">
                  <FiZap />
                  <span>Fast</span>
                </div>
              </div>
              <div className="hero-cloud">
                <FiCloud className="cloud-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security">
        <div className="container">
          <div className="section-header">
            <h2>Current Security Features</h2>
            <p>Security features currently implemented in SkyCrate</p>
          </div>
          <div className="security-grid">
            <div className="security-card card">
              <div className="security-icon">
                <FiLock />
              </div>
              <h3>JWT Authentication</h3>
              <p>Secure user authentication using JSON Web Tokens (JWT) for session management.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiShield />
              </div>
              <h3>Isolated User Buckets</h3>
              <p>Each user has an isolated AWS S3 bucket to ensure data separation and security.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiAward />
              </div>
              <h3>Pre-Signed URLs</h3>
              <p>Secure file uploads and downloads using AWS pre-signed URLs with limited access and expiration.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiGlobe />
              </div>
              <h3>Role-Based Access Control</h3>
              <p>Access to files and operations is controlled based on user roles and permissions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Savings Section */}
      <section id="cost-savings" className="cost-savings">
        <div className="container">
          <div className="section-header">
            <h2>Save up to 84% on cloud storage costs</h2>
            <p>Automatic optimization using AWS S3 storage classes based on your file usage patterns</p>
          </div>
          <div className="savings-grid">
            <div className="savings-card card">
              <div className="savings-icon">
                <FiZap />
              </div>
              <h3>Large Video Files</h3>
              <div className="savings-comparison">
                <div className="old-cost">
                  <span className="cost-label">Standard Storage:</span>
                  <span className="cost-amount">$0.023/GB</span>
                </div>
                <div className="new-cost">
                  <span className="cost-label">Standard-IA:</span>
                  <span className="cost-amount">$0.0125/GB</span>
                </div>
                <div className="savings-amount">
                  <span>46% Savings</span>
                </div>
              </div>
            </div>
            <div className="savings-card card">
              <div className="savings-icon">
                <FiServer />
              </div>
              <h3>Archive Files</h3>
              <div className="savings-comparison">
                <div className="old-cost">
                  <span className="cost-label">Standard Storage:</span>
                  <span className="cost-amount">$0.023/GB</span>
                </div>
                <div className="new-cost">
                  <span className="cost-label">Glacier:</span>
                  <span className="cost-amount">$0.0036/GB</span>
                </div>
                <div className="savings-amount">
                  <span>84% Savings</span>
                </div>
              </div>
            </div>
            <div className="savings-card card">
              <div className="savings-icon">
                <FiShield />
              </div>
              <h3>Mixed Workload (100GB)</h3>
              <div className="savings-comparison">
                <div className="old-cost">
                  <span className="cost-label">All Standard:</span>
                  <span className="cost-amount">$2.30/month</span>
                </div>
                <div className="new-cost">
                  <span className="cost-label">Optimized:</span>
                  <span className="cost-amount">$1.20/month</span>
                </div>
                <div className="savings-amount">
                  <span>48% Savings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Classes Section */}
      <section id="storage-classes" className="storage-classes">
        <div className="container">
          <div className="section-header">
            <h2>Smart Storage That Saves You Money</h2>
            <p>SkyCrate automatically chooses the perfect storage type for each file, so you pay less without thinking about it</p>
          </div>
          <div className="classes-grid">
            <div className="class-card card featured">
              <div className="class-header">
                <div className="class-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <span className="class-price">$0.029/GB/month</span>
                <span className="margin-info">25% service margin</span>
              </div>
              <p className="class-description">Perfect for photos, documents, and files you use every day</p>
              <ul className="class-features">
                <li>Instant access anytime</li>
                <li>Best for active files</li>
                <li>No waiting, ever</li>
              </ul>
              <div className="class-badge">Most Popular</div>
            </div>
            <div className="class-card card">
              <div className="class-header">
                <div className="class-icon">💎</div>
                <h3>Smart Saver</h3>
                <span className="class-price">$0.017/GB/month</span>
                <span className="margin-info">35% service margin</span>
              </div>
              <p className="class-description">Great for large videos and files you don't access often</p>
              <ul className="class-features">
                <li>46% base cost savings</li>
                <li>Still instant access</li>
                <li>Perfect for big files</li>
              </ul>
            </div>
            <div className="class-card card">
              <div className="class-header">
                <div className="class-icon">🏔️</div>
                <h3>Archive Pro</h3>
                <span className="class-price">$0.006/GB/month</span>
                <span className="margin-info">45% service margin</span>
              </div>
              <p className="class-description">Ultra-cheap storage for important backups</p>
              <ul className="class-features">
                <li>83% base cost savings</li>
                <li>Instant when needed</li>
                <li>Professional archiving</li>
              </ul>
            </div>
            <div className="class-card card">
              <div className="class-header">
                <div className="class-icon">🧊</div>
                <h3>Deep Freeze</h3>
                <span className="class-price">$0.005/GB/month</span>
                <span className="margin-info">50% service margin</span>
              </div>
              <p className="class-description">Lock away old files at rock-bottom prices</p>
              <ul className="class-features">
                <li>84% base cost savings</li>
                <li>1-5 minute access</li>
                <li>Long-term storage</li>
              </ul>
            </div>
            <div className="class-card card">
              <div className="class-header">
                <div className="class-icon">🏛️</div>
                <h3>Vault Keeper</h3>
                <span className="class-price">$0.002/GB/month</span>
                <span className="margin-info">60% service margin</span>
              </div>
              <p className="class-description">Digital safety deposit box for permanent archives</p>
              <ul className="class-features">
                <li>96% base cost savings</li>
                <li>12-hour retrieval</li>
                <li>Set and forget</li>
              </ul>
            </div>
          </div>
          <div className="storage-automation">
            <div className="automation-card">
              <h3>🤖 Automatic Optimization</h3>
              <p>SkyCrate's AI automatically picks the best storage type for each file. Upload a vacation video? It goes to Smart Saver. Old tax documents? Straight to Archive Pro. You save money without lifting a finger.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why choose SkyCrate?</h2>
            <p>Experience the next generation of secure cloud storage with intelligent cost optimization</p>
          </div>
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">
                <FiCloud />
              </div>
              <h3>AWS S3 Optimization</h3>
              <p>Automatic storage class selection based on file type, size, and access patterns for maximum cost savings.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Bank-Level Security</h3>
              <p>Your files are encrypted with military-grade security. Your privacy is our top priority.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <FiZap />
              </div>
              <h3>Real-Time Cost Analytics</h3>
              <p>Monitor your storage costs in real-time with detailed breakdowns by storage class and usage patterns.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <FiSmartphone />
              </div>
              <h3>Cross-Platform</h3>
              <p>Access your files from any device - desktop, tablet, or mobile. Always in sync.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <FiUsers />
              </div>
              <h3>Easy Sharing</h3>
              <p>Share files with anyone using secure links. Control who can view and edit your files.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <FiLock />
              </div>
              <h3>Pay-As-You-Go Billing</h3>
              <p>Transparent pricing with 30% margin over AWS costs. Only pay for what you use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* Removed pricing section as per user request since pay-as-you-go model is offered */}

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to get started?</h2>
            <p>Join millions of users who trust SkyCrate with their files</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Your Free Trial
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section footer-logo-section">
              <div className="footer-logo">
                <FiCloud />
                <span>SkyCrate</span>
              </div>
              <p>Your trusted cloud storage solution</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#security">Security</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#docs">Documentation</a>
              <a href="#status">Status</a>
            </div>
            <div className="footer-section social-media">
              <h4>Follow Us</h4>
              <a href="https://twitter.com/skycrate" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://linkedin.com/company/skycrate" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://github.com/skycrate" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 SkyCrate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 