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
                <span>Enterprise-Grade Security</span>
              </div>
              <h1 className="hero-title">
                Your files, <span className="text-primary">secure</span> everywhere
              </h1>
              <p className="hero-subtitle">
                Trusted by millions of users worldwide. SkyCrate provides military-grade encryption 
                and enterprise-level security for your most valuable files.
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
                  <span className="stat-number">10M+</span>
                  <span className="stat-label">Files Protected</span>
                </div>
                <div className="stat">
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">Trusted Users</span>
                </div>
                <div className="stat">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Uptime</span>
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
            <h2>Bank-level security you can trust</h2>
            <p>Your data is protected with the same security standards used by financial institutions</p>
          </div>
          <div className="security-grid">
            <div className="security-card card">
              <div className="security-icon">
                <FiLock />
              </div>
              <h3>End-to-End Encryption</h3>
              <p>Your files are encrypted before they leave your device and remain encrypted in transit and at rest.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiShield />
              </div>
              <h3>Zero-Knowledge Architecture</h3>
              <p>We can't access your files. Only you have the keys to decrypt your data.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiAward />
              </div>
              <h3>SOC 2 Type II Certified</h3>
              <p>Our security practices are independently audited and certified by leading security firms.</p>
            </div>
            <div className="security-card card">
              <div className="security-icon">
                <FiGlobe />
              </div>
              <h3>Global Compliance</h3>
              <p>Compliant with GDPR, HIPAA, and other international data protection regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why choose SkyCrate?</h2>
            <p>Experience the next generation of secure cloud storage</p>
          </div>
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">
                <FiCloud />
              </div>
              <h3>Unlimited Storage</h3>
              <p>Store as many files as you need with our unlimited storage plans. No more worrying about space.</p>
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
              <h3>Lightning Fast</h3>
              <p>Upload and download files at incredible speeds with our optimized infrastructure.</p>
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
            <h2>Simple, transparent pricing</h2>
            <p>Choose the plan that fits your needs</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card card">
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
              <Link to="/register" className="btn btn-secondary">Get Started</Link>
            </div>
            <div className="pricing-card card featured">
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
              <Link to="/register" className="btn btn-primary">Start Free Trial</Link>
            </div>
            <div className="pricing-card card">
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
              <Link to="/register" className="btn btn-secondary">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

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
              <a href="#security">Security</a>
              <a href="#pricing">Pricing</a>
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