'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { supabase } from '../lib/supabase-client';
import { Internship } from '../lib/data';
import Link from 'next/link';
import styles from './Account.module.css';
import DesktopHeader from '../components/DesktopHeader';
import AuthModal from '../components/AuthModal';
import { usePathname } from 'next/navigation';

interface SavedRole {
  id: string;
  role_id: string;
  internship_data: Internship;
  saved_at: string;
}

export default function AccountPage() {
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'saved' | 'settings'>('saved');
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  // Set initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
  };

  // Fetch saved roles - WRAPPED IN useCallback
  const fetchSavedRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_roles')
        .select('*')
        .eq('user_id', user?.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedRoles(data || []);
    } catch (error) {
      console.error('Error fetching saved roles:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch saved roles
  useEffect(() => {
    if (user) {
      fetchSavedRoles();
    }
  }, [user, fetchSavedRoles]);

  const handleRemoveSaved = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from('saved_roles')
        .delete()
        .eq('id', savedId);

      if (error) throw error;
      
      setSavedRoles(prev => prev.filter(role => role.id !== savedId));
      setMessage('Role removed from saved list');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error: unknown) {
      setMessage('Error removing role');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error updating password';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <DesktopHeader />
        <div className={styles.unauthorized}>
          <h2>Please sign in to access account settings</h2>
          <p>You need to be logged in to view your saved roles and account settings.</p>
          <button 
            className={styles.signInButton}
            onClick={() => setShowAuthModal(true)}
          >
            <i className="fas fa-sign-in-alt"></i> Sign In
          </button>
        </div>

        {/* Mobile Navigation for unauthorized users */}
        <nav className={styles.mobileNav}>
          <div className={styles.mobileNavList}>
            <Link href="/" className={styles.mobileNavItem} aria-label="Home">
              <i className={`fas fa-home ${styles.mobileNavIcon}`}></i>
              <span>Home</span>
            </Link>
            <Link href="/" className={styles.mobileNavItem} aria-label="Search">
              <i className={`fas fa-search ${styles.mobileNavIcon}`}></i>
              <span>Search</span>
            </Link>
            <button 
              className={styles.mobileNavItem} 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} ${styles.mobileNavIcon}`}></i>
              <span>Theme</span>
            </button>
            <button 
              className={styles.mobileNavItem} 
              onClick={() => setShowAuthModal(true)}
              aria-label="Sign in"
            >
              <i className={`fas fa-user ${styles.mobileNavIcon}`}></i>
              <span>Account</span>
            </button>
          </div>
        </nav>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Desktop Header - Only shows on desktop */}
      <DesktopHeader />
      
      {/* Mobile Header - Only shows on mobile */}
      <header className={styles.mobileHeader}>
        <h1>Account Settings</h1>
        <p>Manage your saved internships and account preferences</p>
      </header>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <i className="fas fa-bookmark"></i>
          <span className={styles.tabText}>Saved Roles</span>
          <span className={styles.tabCount}>({savedRoles.length})</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fas fa-cog"></i>
          <span className={styles.tabText}>Account Settings</span>
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'saved' && (
          <div className={styles.savedSection}>
            <h2>Saved Internship Roles</h2>
            {loading ? (
              <div className={styles.loading}>
                <i className="fas fa-spinner fa-spin"></i> Loading saved roles...
              </div>
            ) : savedRoles.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-bookmark"></i>
                <h3>No saved roles yet</h3>
                <p>Start browsing internships and save ones you&apos;re interested in!</p>
                <Link href="/" className={styles.browseButton}>
                  Browse Internships
                </Link>
              </div>
            ) : (
              <div className={styles.savedGrid}>
                {savedRoles.map((savedRole) => (
                  <div key={savedRole.id} className={styles.savedCard}>
                    <div className={styles.cardHeader}>
                      <h3>{savedRole.internship_data.title}</h3>
                      <p className={styles.company}>{savedRole.internship_data.company}</p>
                    </div>
                    
                    <div className={styles.cardDetails}>
                      <div className={styles.detail}>
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{savedRole.internship_data.location}</span>
                      </div>
                      <div className={styles.detail}>
                        <i className="fas fa-money-bill-wave"></i>
                        <span>{savedRole.internship_data.salary}</span>
                      </div>
                      <div className={styles.detail}>
                        <i className="fas fa-calendar"></i>
                        <span>Saved {new Date(savedRole.saved_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <Link 
                        href={`/role/${savedRole.role_id}`} 
                        className={styles.viewButton}
                      >
                        <i className="fas fa-eye"></i> View Details
                      </Link>
                      <button 
                        onClick={() => handleRemoveSaved(savedRole.id)}
                        className={styles.removeButton}
                      >
                        <i className="fas fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsSection}>
            <h2>Account Settings</h2>
            
            <div className={styles.userInfo}>
              <h3>Profile Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Account Created</label>
                  <p>{new Date(user.created_at!).toLocaleDateString()}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Last Sign In</label>
                  <p>{new Date(user.last_sign_in_at!).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className={styles.passwordSection}>
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {message && (
                  <div className={`${styles.message} ${
                    message.includes('Error') || message.includes('match') || message.includes('least')
                      ? styles.error 
                      : styles.success
                  }`}>
                    <i className={`fas ${message.includes('Error') || message.includes('match') || message.includes('least') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                    {message}
                  </div>
                )}

                <button type="submit" className={styles.saveButton}>
                  <i className="fas fa-key"></i> Update Password
                </button>
              </form>
            </div>

            <div className={styles.dangerZone}>
              <h3>Danger Zone</h3>
              <div className={styles.dangerActions}>
                <button className={styles.deleteButton}>
                  <i className="fas fa-trash"></i> Delete Account
                </button>
                <p className={styles.warning}>
                  Permanently delete your account and all saved data. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation - Only shows on mobile */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavList}>
          <Link href="/" className={styles.mobileNavItem} aria-label="Home">
            <i className={`fas fa-home ${styles.mobileNavIcon}`}></i>
            <span>Home</span>
          </Link>
          <button 
            className={`${styles.mobileNavItem} ${activeTab === 'saved' ? styles.active : ''}`}
            onClick={() => setActiveTab('saved')}
            aria-label="Saved roles"
          >
            <i className={`fas fa-bookmark ${styles.mobileNavIcon}`}></i>
            <span>Saved</span>
          </button>
          <button 
            className={`${styles.mobileNavItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
            aria-label="Account settings"
          >
            <i className={`fas fa-cog ${styles.mobileNavIcon}`}></i>
            <span>Settings</span>
          </button>
          <button 
            className={styles.mobileNavItem} 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} ${styles.mobileNavIcon}`}></i>
            <span>Theme</span>
          </button>
          <Link href="/account" className={`${styles.mobileNavItem} ${pathname === '/account' ? styles.active : ''}`} aria-label="Account">
            <i className={`fas fa-user ${styles.mobileNavIcon}`}></i>
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}