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
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiAward,
  FiTrendingUp,
  FiDatabase,
  FiStar
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import './LandingPage.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="landing-page">
      {/* Modern Floating Navigation */}
      <nav className="modern-navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-brand">
              <FiCloud className="brand-icon" />
              <span className="brand-text">SkyCrate</span>
            </div>
            
            <div className={`nav-menu ${mobileMenuOpen ? 'nav-menu-open' : ''}`}>
              <a href="#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#solutions" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
              <a href="#pricing" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <Link to="/login" className="nav-btn nav-btn-ghost">Sign In</Link>
              <Link to="/register" className="nav-btn nav-btn-primary">Get Started</Link>
            </div>
            
            <div className="nav-controls">
              <button 
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              >
                {isDark ? <FiSun /> : <FiMoon />}
              </button>
              <button 
                className="mobile-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Full-Screen Hero Section */}
      <section className="modern-hero">
        <div className="hero-container">
          <div className="hero-layout">
            <div className="hero-content">
              <div className="hero-badge">
                <FiAward className="badge-icon" />
                <span className="badge-text">AWS S3 Optimized Storage</span>
              </div>
              
              <h1 className="hero-heading">
                Smart Cloud Storage
                <span className="hero-highlight">That Saves Money</span>
              </h1>
              
              <p className="hero-description">
                Automatic AWS S3 optimization with up to 84% cost savings. 
                Pay-as-you-go billing with intelligent storage class selection.
              </p>
              
              <div className="hero-cta">
                <Link to="/register" className="cta-primary">
                  <span>Start Free Trial</span>
                  <FiArrowRight className="cta-icon" />
                </Link>
                <button className="cta-secondary">
                  <span>Watch Demo</span>
                </button>
              </div>
              
              <div className="hero-metrics">
                <div className="metric-item">
                  <div className="metric-value">84%</div>
                  <div className="metric-label">Cost Savings</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">99.9%</div>
                  <div className="metric-label">Uptime</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">10k+</div>
                  <div className="metric-label">Users</div>
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="visual-grid">
                <div className="visual-card card-secure">
                  <FiShield className="visual-icon" />
                  <span className="visual-label">Bank-Level Security</span>
                </div>
                <div className="visual-card card-fast">
                  <FiZap className="visual-icon" />
                  <span className="visual-label">Lightning Fast</span>
                </div>
                <div className="visual-card card-smart">
                  <FiTrendingUp className="visual-icon" />
                  <span className="visual-label">Smart Optimization</span>
                </div>
                <div className="visual-card card-reliable">
                  <FiDatabase className="visual-icon" />
                  <span className="visual-label">99.9% Reliable</span>
                </div>
              </div>
              <div className="hero-centerpiece">
                <FiCloud className="centerpiece-icon" />
                <div className="centerpiece-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Solutions Section */}
      <section id="solutions" className="modern-solutions">
        <div className="solutions-container">
          <div className="section-intro">
            <h2 className="section-title">Smart Storage Solutions</h2>
            <p className="section-subtitle">
              Automatic optimization and enterprise-grade security that saves you up to 84% on storage costs
            </p>
          </div>
          
          <div className="solutions-grid">
            <div className="solution-card card-primary">
              <div className="card-header">
                <div className="card-icon">
                  <FiTrendingUp />
                </div>
                <h3 className="card-title">Cost Optimization</h3>
              </div>
              <div className="card-content">
                <p className="card-description">
                  AI-powered storage class selection automatically moves your files to the most cost-effective tier
                </p>
                <div className="savings-showcase">
                  <div className="savings-item">
                    <span className="savings-percent">84%</span>
                    <span className="savings-type">Archive Files</span>
                  </div>
                  <div className="savings-item">
                    <span className="savings-percent">46%</span>
                    <span className="savings-type">Video Files</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="solution-card card-secondary">
              <div className="card-header">
                <div className="card-icon">
                  <FiShield />
                </div>
                <h3 className="card-title">Enterprise Security</h3>
              </div>
              <div className="card-content">
                <p className="card-description">
                  Bank-level encryption, isolated storage, and role-based access control
                </p>
                <ul className="security-features">
                  <li>JWT Authentication</li>
                  <li>Isolated User Buckets</li>
                  <li>Pre-Signed URLs</li>
                  <li>Role-Based Access</li>
                </ul>
              </div>
            </div>
            
            <div className="solution-card card-accent">
              <div className="card-header">
                <div className="card-icon">
                  <FiZap />
                </div>
                <h3 className="card-title">Lightning Performance</h3>
              </div>
              <div className="card-content">
                <p className="card-description">
                  Global CDN, instant access, and 99.9% uptime guarantee
                </p>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-number">99.9%</span>
                    <span className="metric-text">Uptime</span>
                  </div>
                  <div className="metric">
                    <span className="metric-number">&lt;100ms</span>
                    <span className="metric-text">Response</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Pricing Section */}
      <section id="pricing" className="modern-pricing">
        <div className="pricing-container">
          <div className="pricing-intro">
            <h2 className="pricing-title">Transparent Pricing</h2>
            <p className="pricing-subtitle">
              Pay only for what you use with automatic optimization that saves you money
            </p>
          </div>
          
          <div className="pricing-tiers">
            <div className="tier-card tier-featured">
              <div className="tier-badge">
                <FiStar className="badge-icon" />
                <span>Most Popular</span>
              </div>
              <div className="tier-header">
                <div className="tier-icon">⚡</div>
                <h3 className="tier-name">Lightning Fast</h3>
                <div className="tier-price">$0.029<span>/GB/month</span></div>
              </div>
              <p className="tier-description">Perfect for active files and daily use</p>
              <ul className="tier-features">
                <li>Instant access anytime</li>
                <li>Best for photos & documents</li>
                <li>No retrieval delays</li>
                <li>25% service margin</li>
              </ul>
            </div>
            
            <div className="tier-card">
              <div className="tier-header">
                <div className="tier-icon">💎</div>
                <h3 className="tier-name">Smart Saver</h3>
                <div className="tier-price">$0.017<span>/GB/month</span></div>
              </div>
              <p className="tier-description">Great for large videos and occasional access</p>
              <ul className="tier-features">
                <li>46% cost savings</li>
                <li>Still instant access</li>
                <li>Perfect for big files</li>
                <li>35% service margin</li>
              </ul>
            </div>
            
            <div className="tier-card">
              <div className="tier-header">
                <div className="tier-icon">🏔️</div>
                <h3 className="tier-name">Archive Pro</h3>
                <div className="tier-price">$0.006<span>/GB/month</span></div>
              </div>
              <p className="tier-description">Ultra-cheap storage for backups</p>
              <ul className="tier-features">
                <li>83% cost savings</li>
                <li>Instant retrieval</li>
                <li>Professional archiving</li>
                <li>45% service margin</li>
              </ul>
            </div>
          </div>
          
          <div className="automation-highlight">
            <div className="automation-content">
              <div className="automation-icon">
                <FiZap />
              </div>
              <div className="automation-text">
                <h3>Automatic Optimization</h3>
                <p>Our AI automatically selects the best storage tier for each file, maximizing your savings without any effort</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section id="features" className="modern-features">
        <div className="features-container">
          <div className="features-intro">
            <h2 className="features-title">Why Choose SkyCrate?</h2>
            <p className="features-subtitle">
              Next-generation cloud storage with intelligent optimization and enterprise-grade security
            </p>
          </div>
          
          <div className="features-showcase">
            <div className="feature-item">
              <div className="feature-visual">
                <FiCloud className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">AWS S3 Optimization</h3>
                <p className="feature-text">
                  Automatic storage class selection based on file patterns for maximum cost savings
                </p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-visual">
                <FiShield className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">Bank-Level Security</h3>
                <p className="feature-text">
                  Military-grade encryption with isolated storage and role-based access control
                </p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-visual">
                <FiTrendingUp className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">Real-Time Analytics</h3>
                <p className="feature-text">
                  Monitor storage costs with detailed breakdowns and usage insights
                </p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-visual">
                <FiSmartphone className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">Cross-Platform Access</h3>
                <p className="feature-text">
                  Seamless file access across desktop, tablet, and mobile devices
                </p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-visual">
                <FiUsers className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">Secure Sharing</h3>
                <p className="feature-text">
                  Share files with controlled access and time-limited secure links
                </p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-visual">
                <FiLock className="feature-icon" />
              </div>
              <div className="feature-details">
                <h3 className="feature-name">Pay-As-You-Go</h3>
                <p className="feature-text">
                  Transparent pricing with no hidden fees - only pay for what you use
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="modern-cta">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-heading">Ready to Optimize Your Storage?</h2>
            <p className="cta-text">
              Join thousands of users saving up to 84% on cloud storage costs
            </p>
            <div className="cta-actions">
              <Link to="/register" className="cta-button-primary">
                <span>Start Free Trial</span>
                <FiArrowRight className="cta-arrow" />
              </Link>
            </div>
            <div className="cta-trust">
              <span className="trust-text">No credit card required • 30-day free trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Minimal Footer */}
      <footer className="modern-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <FiCloud className="footer-logo-icon" />
                <span className="footer-logo-text">SkyCrate</span>
              </div>
              <p className="footer-tagline">Smart cloud storage that saves money</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-group">
                <h4 className="footer-heading">Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#solutions" className="footer-link">Solutions</a>
                <a href="#pricing" className="footer-link">Pricing</a>
              </div>
              
              <div className="footer-group">
                <h4 className="footer-heading">Company</h4>
                <a href="#about" className="footer-link">About</a>
                <a href="#contact" className="footer-link">Contact</a>
                <a href="#careers" className="footer-link">Careers</a>
              </div>
              
              <div className="footer-group">
                <h4 className="footer-heading">Support</h4>
                <a href="#help" className="footer-link">Help Center</a>
                <a href="#docs" className="footer-link">Documentation</a>
                <a href="#status" className="footer-link">Status</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-legal">
              <span>&copy; 2024 SkyCrate. All rights reserved.</span>
            </div>
            <div className="footer-social">
              <a href="https://twitter.com/skycrate" target="_blank" rel="noopener noreferrer" className="social-link">
                Twitter
              </a>
              <a href="https://linkedin.com/company/skycrate" target="_blank" rel="noopener noreferrer" className="social-link">
                LinkedIn
              </a>
              <a href="https://github.com/skycrate" target="_blank" rel="noopener noreferrer" className="social-link">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 