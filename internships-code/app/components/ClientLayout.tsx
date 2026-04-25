'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'; 

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    push: false,
    smartMatching: true
  });
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  const getMobileNavClass = (path: string) => {
    if (pathname === path) return 'mobile-nav-item active';
    return 'mobile-nav-item';
  }

  const handleNotificationToggle = (type: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleJoinNotificationList = () => {
    window.open('https://join.internships.click/', '_blank');
    setShowNotificationPopup(false);
  };

  return (
    <>
      <div className="container">
        {children}
      </div>

      {/* Mobile Navigation - Updated with Notification Button */}
      <nav className="mobile-nav">
        <div className="mobile-nav-list">
          <Link href="/" className={getMobileNavClass('/')}>
            <i className="fas fa-home mobile-nav-icon"></i>
            <span>Home</span>
          </Link>
          <a href="#" className="mobile-nav-item" onClick={(e) => { 
            e.preventDefault(); 
            const searchInput = document.getElementById('mobileSearchInput') as HTMLInputElement;
            searchInput?.focus();
          }}>
            <i className="fas fa-search mobile-nav-icon"></i>
            <span>Search</span>
          </a>
          {/* NEW: Notification Button */}
          <a href="#" className="mobile-nav-item" onClick={(e) => { 
            e.preventDefault(); 
            setShowNotificationPopup(true);
          }}>
            <i className="fas fa-bell mobile-nav-icon"></i>
            <span>Alerts</span>
          </a>
          {/* Theme button */}
          <a href="#" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); toggleTheme(); }}>
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} mobile-nav-icon`}></i>
            <span>Theme</span>
          </a>
          {/* Account button */}
          <a href="#" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); document.getElementById('mobileAccountPopup')?.classList.toggle('active'); }}>
            <i className="fas fa-user mobile-nav-icon"></i>
            <span>Account</span>
          </a>
        </div>
      </nav>

      {/* NEW: Mobile Notification Popup */}
      {showNotificationPopup && (
        <div className="mobile-notification-popup active">
          <div className="mobile-notification-popup-content">
            <div className="mobile-notification-header">
              <h3>Notification Settings</h3>
              <button className="close-popup" onClick={() => setShowNotificationPopup(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mobile-notification-content">
              <div 
                className="mobile-notification-option"
                onClick={() => handleNotificationToggle('email')}
              >
                <i className="fas fa-envelope"></i>
                <div className="mobile-notification-text">
                  <div className="mobile-notification-title">Email Notifications</div>
                  <div className="mobile-notification-description">Get alerts for new internships</div>
                </div>
                <div className={`mobile-notification-toggle ${notificationSettings.email ? 'active' : ''}`}></div>
              </div>
              
              <div 
                className="mobile-notification-option"
                onClick={() => handleNotificationToggle('push')}
              >
                <i className="fas fa-bell"></i>
                <div className="mobile-notification-text">
                  <div className="mobile-notification-title">Push Notifications</div>
                  <div className="mobile-notification-description">Browser notifications for new roles</div>
                </div>
                <div className={`mobile-notification-toggle ${notificationSettings.push ? 'active' : ''}`}></div>
              </div>
              
              <div 
                className="mobile-notification-option"
                onClick={() => handleNotificationToggle('smartMatching')}
              >
                <i className="fas fa-filter"></i>
                <div className="mobile-notification-text">
                  <div className="mobile-notification-title">Smart Matching</div>
                  <div className="mobile-notification-description">Alerts based on your skills</div>
                </div>
                <div className={`mobile-notification-toggle ${notificationSettings.smartMatching ? 'active' : ''}`}></div>
              </div>
              
              <div className="mobile-notification-actions">
                <button className="mobile-notification-btn" onClick={handleJoinNotificationList}>
                  <i className="fas fa-rocket"></i>
                  <span>Join Main Notification List</span>
                </button>
                
                <button className="mobile-notification-btn secondary" onClick={() => setShowNotificationPopup(false)}>
                  <i className="fas fa-cog"></i>
                  <span>Customize Alerts</span>
                </button>
              </div>
            </div>
          </div>
          <div className="mobile-notification-popup-backdrop" onClick={() => setShowNotificationPopup(false)}></div>
        </div>
      )}

      {/* Mobile Account Popup */}
      <div className="mobile-account-popup" id="mobileAccountPopup">
        <div className="mobile-account-popup-content">
          <div className="mobile-account-header">
            <h3>Account</h3>
            <button className="close-popup" onClick={() => document.getElementById('mobileAccountPopup')?.classList.remove('active')}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="mobile-account-options">
            <button className="mobile-auth-btn signin-btn" onClick={() => { 
              document.getElementById('mobileAccountPopup')?.classList.remove('active'); 
              const authButton = document.querySelector('.auth-button') as HTMLButtonElement;
              authButton?.click();
            }}>
              <i className="fas fa-sign-in-alt"></i>
              <span>Sign In</span>
            </button>
            <button className="mobile-auth-btn signup-btn" onClick={() => { 
              document.getElementById('mobileAccountPopup')?.classList.remove('active'); 
              const authButton = document.querySelector('.auth-button') as HTMLButtonElement;
              authButton?.click();
            }}>
              <i className="fas fa-user-plus"></i>
              <span>Sign Up</span>
            </button>
            <div className="mobile-account-links">
              <Link href="/account" className="mobile-account-link" onClick={() => document.getElementById('mobileAccountPopup')?.classList.remove('active')}>
                <i className="fas fa-bookmark"></i>
                <span>Saved Roles</span>
              </Link>
              <Link href="/account" className="mobile-account-link" onClick={() => document.getElementById('mobileAccountPopup')?.classList.remove('active')}>
                <i className="fas fa-cog"></i>
                <span>Account Settings</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mobile-account-popup-backdrop" onClick={() => document.getElementById('mobileAccountPopup')?.classList.remove('active')}></div>
      </div>

      {/* Notification placeholder */}
      <div className="notification" id="notification"></div>
    </>
  );
}