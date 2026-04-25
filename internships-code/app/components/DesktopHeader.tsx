// components/DesktopHeader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';
import { supabase } from '../lib/supabase-client';
import AuthModal from './AuthModal';
import Link from 'next/link';
import Image from 'next/image';

export default function DesktopHeader() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoading } = useSupabase();

  // Set initial theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Update theme state when it changes
  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    };

    // Initial check
    handleThemeChange();

    // Watch for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, [theme]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  const handleAuthClick = (isSignUp: boolean = false) => {
    setShowDropdown(false);
    setShowAuthModal(true);
  };

  // Check if we're on homepage
  const isHomePage = pathname === '/';

  // Handle navigation
  const handleNavigation = (page: string) => {
    if (page === 'home') {
      window.location.href = '/';
    }
    // About and Contact will be added later
  };

  if (isLoading) {
    return (
      <div className="desktop-header-container">
        <div className="desktop-header">
          <div className="header-loading">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="desktop-header-container">
        <div className="desktop-header">
          {/* Logo/Title */}
          <div className="header-left">
            <div className="logo-container" onClick={() => handleNavigation('home')} style={{ cursor: 'pointer' }}>
              <div className="logo-image-wrapper">
                <Image 
src="/logo.png"
                  alt="Internships.click Logo" 
                  width={200} 
                  height={50  } 
                  priority
                />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="header-center">
            <nav className="header-nav">
              <button 
                className={`nav-button home ${isHomePage ? 'active' : ''}`}
                onClick={() => handleNavigation('home')}
              >
                <div className="button-content">
                  <i className="fas fa-home"></i>
                  <span>Home</span>
                </div>
                {isHomePage && <div className="active-indicator"></div>}
              </button>
              <button className="nav-button theme" onClick={toggleTheme}>
                <div className="button-content">
                  <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
                  <span>Theme</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Auth Dropdown */}
          <div className="header-right" ref={dropdownRef}>
            <div className="dropdown-container">
              {user ? (
                // User is logged in
                <button className="auth-dropdown-trigger logged-in" onClick={toggleDropdown}>
                  <div className="user-info-container">
                    <div className="user-avatar">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</span>
                      <span className="user-status">Active</span>
                    </div>

                    <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} chevron`}></i>
                  </div>
                </button>
              ) : (
                // User is logged out
                <button className="auth-dropdown-trigger" onClick={toggleDropdown}>
                  <div className="user-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <span>Account</span>
                  <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} chevron`}></i>
                </button>
              )}
              
              {showDropdown && (
                <div className="auth-dropdown">
                  {user ? (
                    // Logged in dropdown
                    <>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" />
                          ) : (
                            <i className="fas fa-user-circle"></i>
                          )}
                        </div>
                        <div className="dropdown-info">
                          <p className="dropdown-title">{user.user_metadata?.full_name || 'Welcome!'}</p>
                          <p className="dropdown-subtitle">{user.email}</p>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link 
                        href="/account" 
                        className="dropdown-item saved-roles"
                        onClick={() => setShowDropdown(false)}
                      >
                        <i className="fas fa-bookmark"></i>
                        <span>Saved Roles</span>
                      </Link>
                      <Link 
                        href="/account" 
                        className="dropdown-item account-settings"
                        onClick={() => setShowDropdown(false)}
                      >
                        <i className="fas fa-user-cog"></i>
                        <span>Account Settings</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item signout" onClick={handleSignOut}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    // Logged out dropdown
                    <>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="dropdown-info">
                          <p className="dropdown-title">Welcome!</p>
                          <p className="dropdown-subtitle">Sign in to save roles</p>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item signin" onClick={() => handleAuthClick(false)}>
                        <i className="fas fa-sign-in-alt"></i>
                        <span>Sign In</span>
                      </button>
                      <button className="dropdown-item signup" onClick={() => handleAuthClick(true)}>
                        <i className="fas fa-user-plus"></i>
                        <span>Create Account</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}