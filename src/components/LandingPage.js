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
  FiCheck
} from 'react-icons/fi';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <FiCloud className="logo-icon" />
            <span>SkyCrate</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <Link to="/dashboard" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Files, <span className="gradient-text">Everywhere</span>
            </h1>
            <p className="hero-subtitle">
              Store, share, and access your files from anywhere. SkyCrate provides 
              secure cloud storage with lightning-fast upload speeds and seamless collaboration.
            </p>
            <div className="hero-buttons">
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Start Uploading
                <FiArrowRight />
              </Link>
              <button className="btn btn-secondary btn-large">
                Watch Demo
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10M+</span>
                <span className="stat-label">Files Stored</span>
              </div>
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <FiCloud />
              <span>Cloud Storage</span>
            </div>
            <div className="floating-card card-2">
              <FiShield />
              <span>Secure</span>
            </div>
            <div className="floating-card card-3">
              <FiZap />
              <span>Fast</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SkyCrate?</h2>
            <p>Experience the next generation of cloud storage</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiCloud />
              </div>
              <h3>Unlimited Storage</h3>
              <p>Store as many files as you need with our unlimited storage plans. No more worrying about space.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Bank-Level Security</h3>
              <p>Your files are encrypted with military-grade security. Your privacy is our top priority.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiZap />
              </div>
              <h3>Lightning Fast</h3>
              <p>Upload and download files at incredible speeds with our optimized infrastructure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiSmartphone />
              </div>
              <h3>Cross-Platform</h3>
              <p>Access your files from any device - desktop, tablet, or mobile. Always in sync.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiUsers />
              </div>
              <h3>Easy Sharing</h3>
              <p>Share files with anyone using secure links. Control who can view and edit your files.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiLock />
              </div>
              <h3>Privacy First</h3>
              <p>We never access your files. Your data belongs to you, and only you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Choose the plan that fits your needs</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><FiCheck /> 5GB Storage</li>
                <li><FiCheck /> Basic File Sharing</li>
                <li><FiCheck /> Mobile Access</li>
                <li><FiCheck /> Email Support</li>
              </ul>
              <Link to="/dashboard" className="btn btn-secondary">Get Started</Link>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Pro</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">9</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><FiCheck /> 1TB Storage</li>
                <li><FiCheck /> Advanced Sharing</li>
                <li><FiCheck /> Priority Support</li>
                <li><FiCheck /> File Versioning</li>
                <li><FiCheck /> Team Collaboration</li>
              </ul>
              <Link to="/dashboard" className="btn btn-primary">Start Free Trial</Link>
            </div>
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">29</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><FiCheck /> Unlimited Storage</li>
                <li><FiCheck /> Advanced Security</li>
                <li><FiCheck /> 24/7 Support</li>
                <li><FiCheck /> Custom Integrations</li>
                <li><FiCheck /> Admin Controls</li>
              </ul>
              <Link to="/dashboard" className="btn btn-secondary">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join millions of users who trust SkyCrate with their files</p>
            <Link to="/dashboard" className="btn btn-primary btn-large">
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
            <div className="footer-section">
              <div className="footer-logo">
                <FiCloud />
                <span>SkyCrate</span>
              </div>
              <p>Your trusted cloud storage solution</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
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