'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Internship } from '../lib/data';
import NotificationAlert from './NotificationAlert';
import { useSupabase } from './SupabaseProvider';
import AuthModal from './AuthModal';
import DesktopHeader from '../components/DesktopHeader';


// Role Card component
function RoleCard({ internship }: { internship: Internship }) {
  const visibleSkills = internship.skills?.slice(0, 6) ?? [];
  const hiddenSkillCount = Math.max((internship.skills?.length ?? 0) - visibleSkills.length, 0);

  return (
    <div className="role-card" data-id={internship.id}>
      <div className="role-header">
        <div>
          <h3 className="role-title">{internship.title}</h3>
          <p className="role-company">{internship.company}</p>
        </div>
      </div>
      <div className="role-body">
        <div className="role-details">
          <div className="role-detail">
            <i className="fas fa-map-marker-alt role-icon"></i>
            <span>{internship.location}</span>
          </div>
          <div className="role-detail">
            <i className="fas fa-money-bill-wave role-icon"></i>
            <span className="hourly-rate">{internship.salary || 'Not specified'}</span>
          </div>
        </div>
        <div className="role-description">
          <p>{internship.description || ''}</p>
        </div>
        {visibleSkills.length > 0 && (
          <div className="role-skills">
            <div className="skills-header">Required Skills:</div>
            <div className="skills-container">
              {visibleSkills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="skill-tag">{skill}</span>
              ))}
              {hiddenSkillCount > 0 && (
                <span className="skill-tag">+{hiddenSkillCount} more</span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="role-footer">
        <Link href={`/role/${internship.id}`} className="apply-btn">
          <i className="fas fa-info-circle"></i> View Details
        </Link>
      </div>
    </div>
  );
}

// Main component with all interactive elements
export function InternshipPage({ initialInternships }: { initialInternships: Internship[] }) {
  // Get URL parameters and navigation utilities
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Track if this is the first render to prevent double navigation
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // State management with URL synchronization
  const pageFromUrl = parseInt(searchParams.get('page') || '1');
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  
  const searchFromUrl = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  
  const filterFromUrl = searchParams.get('filter') || 'all';
  const [activeFilter, setActiveFilter] = useState(filterFromUrl);
  
  const [mobileView, setMobileView] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const rolesPerPage = 12;

  // Get user from auth context
  const { user } = useSupabase();

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

  // Filtering and searching logic
  const filteredInternships = useMemo(() => {
    let internships = initialInternships;

    if (activeFilter !== 'all') {
      internships = internships.filter(internship =>
        internship.skills.some(skill => skill.toLowerCase() === activeFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      internships = internships.filter(internship =>
        internship.title.toLowerCase().includes(lowercasedQuery) ||
        internship.company.toLowerCase().includes(lowercasedQuery) ||
        internship.location.toLowerCase().includes(lowercasedQuery)
      );
    }
    return internships;
  }, [searchQuery, activeFilter, initialInternships]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInternships.length / rolesPerPage);
  const paginatedInternships = useMemo(() => {
    const startIndex = (currentPage - 1) * rolesPerPage;
    return filteredInternships.slice(startIndex, startIndex + rolesPerPage);
  }, [currentPage, filteredInternships]);

  // FIXED: Handle page change with proper history management
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      
      // Create new URL parameters
      const params = new URLSearchParams();
      
      // Add page parameter
      if (page > 1) {
        params.set('page', page.toString());
      }
      
      // Preserve search parameter if exists
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      
      // Preserve filter parameter if not 'all'
      if (activeFilter !== 'all') {
        params.set('filter', activeFilter);
      }
      
      // Build the new URL
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      
      // Use push instead of replace to add to browser history
      router.push(newUrl, { scroll: false });
      window.scrollTo(0, 0);
    }
  };

  // FIXED: Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to page 1 when filter changes
    
    const params = new URLSearchParams();
    
    // Add search parameter if exists
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    // Add filter parameter if not 'all'
    if (filter !== 'all') {
      params.set('filter', filter);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newUrl, { scroll: false });
  };

  // FIXED: Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 when search changes
    
    const params = new URLSearchParams();
    
    // Add search parameter if not empty
    if (query) {
      params.set('search', query);
    }
    
    // Add filter parameter if not 'all'
    if (activeFilter !== 'all') {
      params.set('filter', activeFilter);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newUrl, { scroll: false });
  };

  const handleExploreFeatures = () => {
    window.open('https://join.internships.click/', '_blank');
    setShowNotificationPopup(false);
  };

  // DYNAMIC STATISTICS CALCULATION - UPDATED
  const { 
    totalRoles, 
    totalCompanies, 
    category1, 
    category2, 
    remoteRoles, 
    topLocation,
    popularSkills 
  } = useMemo(() => {
    // Calculate statistics based on CURRENTLY FILTERED data
    const currentData = filteredInternships;
    
    if (currentData.length === 0) {
      return {
        totalRoles: 0,
        totalCompanies: 0,
        category1: 'No category: 0',
        category2: 'No category: 0',
        remoteRoles: 0,
        topLocation: 'None: 0',
        popularSkills: []
      };
    }
    
    // Category breakdown (dynamic based on what's being shown)
    const categoryCount: { [key: string]: number } = {};
    currentData.forEach(internship => {
      const category = internship.category || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Sort categories by count (most common first)
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2); // Show top 2 categories
    
    // Skill frequency (for filter buttons)
    const skillCount: { [key: string]: number } = {};
    currentData.forEach(internship => {
      internship.skills.forEach(skill => {
        if (skill) {
          skillCount[skill] = (skillCount[skill] || 0) + 1;
        }
      });
    });
    
    // Top locations (exclude "Remote" and empty locations)
    const locationCount: { [key: string]: number } = {};
    currentData.forEach(internship => {
      const location = internship.location || 'Unknown';
      if (!location.toLowerCase().includes('remote') && 
          !location.toLowerCase().includes('not specified') &&
          location.trim() !== '') {
        // Get city name (first part before comma)
        const city = location.split(',')[0].trim();
        locationCount[city] = (locationCount[city] || 0) + 1;
      }
    });
    
    // Get top location
    const topLocationEntry = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])[0] || ['None', 0];
    
    // If no valid locations found, check for remote jobs
    if (topLocationEntry[0] === 'None' && topLocationEntry[1] === 0) {
      const remoteCount = currentData.filter(i => 
        i.location && i.location.toLowerCase().includes('remote')
      ).length;
      if (remoteCount > 0) {
        topLocationEntry[0] = 'Remote';
        topLocationEntry[1] = remoteCount;
      }
    }
    
    return {
      // Dynamic stats based on current filter
      totalRoles: currentData.length,
      totalCompanies: new Set(currentData.map(i => i.company)).size,
      
      // Top 2 categories from current results
      category1: sortedCategories[0] ? `${sortedCategories[0][0]}: ${sortedCategories[0][1]}` : 'Other: 0',
      category2: sortedCategories[1] ? `${sortedCategories[1][0]}: ${sortedCategories[1][1]}` : 'Other: 0',
      
      // Remote count from current results
      remoteRoles: currentData.filter(i => 
        i.location && (
          i.location.toLowerCase().includes('remote') || 
          i.location.toLowerCase().includes('hybrid')
        )
      ).length,
      
      // Top location from current results
      topLocation: `${topLocationEntry[0]}: ${topLocationEntry[1]}`,
      
      // For filter buttons (skills)
      popularSkills: Object.keys(skillCount)
        .filter(skill => skill && skill.trim() !== '')
        .sort((a, b) => skillCount[b] - skillCount[a])
        .slice(0, 5)
    };
  }, [filteredInternships]);

  // FIXED: Sync state with URL changes (when user uses browser back/forward)
  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }
    
    // Update state from URL when it changes (back/forward navigation)
    const newPage = parseInt(searchParams.get('page') || '1');
    const newSearch = searchParams.get('search') || '';
    const newFilter = searchParams.get('filter') || 'all';
    
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
    
    if (newSearch !== searchQuery) {
      setSearchQuery(newSearch);
    }
    
    if (newFilter !== activeFilter) {
      setActiveFilter(newFilter);
    }
  }, [searchParams, isInitialRender]);

  // Reset to page 1 if current page is beyond total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (activeFilter !== 'all') params.set('filter', activeFilter);
      
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      
      router.replace(newUrl, { scroll: false });
    }
  }, [currentPage, totalPages, searchQuery, activeFilter, router, pathname]);

  const features = [
    'Get alerts from best internship opportunities',
    'Never miss new opportunities matching your skills',
    'Instant notifications when roles are posted',
    'Customize by category and skills',
  ];

  return (
    <>
      <DesktopHeader />
      
      {/* Mobile search bar */}
      <div className="mobile-search-bar">
        <div className="mobile-search-container">
            <i className="fas fa-search mobile-search-icon-left"></i>
            <input 
                type="text" 
                className="mobile-search-input" 
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => { 
                  handleSearchChange(e.target.value);
                }}
            />
            <i className="fas fa-sliders-h mobile-search-icon-right"></i>
        </div>
      </div>

      {/* Mobile stats slider - UPDATED with dynamic stats */}
      <div className="mobile-stats-slider">
          <div className="mobile-stat-card">
            <span className="mobile-stat-number">{totalRoles}</span>
            <span className="mobile-stat-label">Roles</span>
          </div>
          <div className="mobile-stat-card">
            <span className="mobile-stat-number">{totalCompanies}</span>
            <span className="mobile-stat-label">Companies</span>
          </div>
          <div className="mobile-stat-card" title={category1.split(':')[0]}>
            <span className="mobile-stat-number">{category1.split(':')[1]?.trim() || '0'}</span>
            <span className="mobile-stat-label">{category1.split(':')[0]?.substring(0, 6)}</span>
          </div>
          <div className="mobile-stat-card">
            <span className="mobile-stat-number">{remoteRoles}</span>
            <span className="mobile-stat-label">Remote</span>
          </div>
          <div className="mobile-stat-card" title={topLocation.split(':')[0]}>
            <span className="mobile-stat-number">{topLocation.split(':')[1]?.trim() || '0'}</span>
            <span className="mobile-stat-label">{topLocation.split(':')[0]?.substring(0, 6)}</span>
          </div>
      </div>
      
      {/* Mobile views container */}
      <div className="mobile-views-container">
          <div className={`mobile-view ${mobileView === 'home' ? 'active' : ''}`}>
              <div className="roles-grid">
                  {paginatedInternships.map(internship => (
                      <RoleCard key={internship.id} internship={internship} />
                  ))}
              </div>
              
              {/* Mobile Pagination Controls */}
              {totalPages > 1 && (
                <div className="mobile-pagination-controls">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1} 
                        className="mobile-pagination-btn"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className="mobile-pagination-text">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages} 
                        className="mobile-pagination-btn"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
              )}
          </div>
          <div className={`mobile-view ${mobileView === 'notify' ? 'active' : ''}`}>
              <NotificationAlert />
          </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="main-content">
        <div className="left-sidebar">
          <div className="stats-container">
            <h3 className="section-title-small">Current Results</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{totalRoles}</span>
                <span className="stat-label">Roles</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{totalCompanies}</span>
                <span className="stat-label">Companies</span>
              </div>
              <div className="stat-card" title={category1.split(':')[0]}>
                <span className="stat-number">{category1.split(':')[1]?.trim() || '0'}</span>
                <span className="stat-label">{category1.split(':')[0]?.substring(0, 8)}</span>
              </div>
              <div className="stat-card" title={category2.split(':')[0]}>
                <span className="stat-number">{category2.split(':')[1]?.trim() || '0'}</span>
                <span className="stat-label">{category2.split(':')[0]?.substring(0, 8)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{remoteRoles}</span>
                <span className="stat-label">Remote</span>
              </div>
              <div className="stat-card" title={topLocation.split(':')[0]}>
                <span className="stat-number">{topLocation.split(':')[1]?.trim() || '0'}</span>
                <span className="stat-label">{topLocation.split(':')[0]?.substring(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="roles-container">
          <h2 className="section-title">Available Roles</h2>
          
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search by company, role, location..."
                value={searchQuery}
                onChange={(e) => { 
                  handleSearchChange(e.target.value);
                }}
              />
              <button className="search-btn"><i className="fas fa-search"></i></button>
            </div>
            <div className="combined-filters-container">
                <h4>Filters:</h4>
                <div className="combined-filters">
                    <button 
                      className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} 
                      onClick={() => handleFilterChange('all')}
                    >
                      All
                    </button>
                    {popularSkills.map((skill, index) => (
                        <button 
                          key={`filter-${skill}-${index}`} 
                          className={`filter-btn ${activeFilter === skill ? 'active' : ''}`} 
                          onClick={() => handleFilterChange(skill)}
                        >
                          {skill}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="roles-grid" id="rolesGridDesktop">
            {paginatedInternships.length > 0 ? (
                paginatedInternships.map(internship => (
                    <RoleCard key={internship.id} internship={internship} />
                ))
            ) : (
                <div className="empty-state">
                  <i className="fas fa-search"></i>
                  <h3>No internships found</h3>
                  <p>Try adjusting your search or filters</p>
                  <button 
                    className="clear-filters-btn" 
                    onClick={() => {
                      handleSearchChange('');
                      handleFilterChange('all');
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" id="paginationControlsDesktop">
                <button 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1} 
                  className="pagination-btn"
                >
                  <i className="fas fa-step-backward"></i>
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="pagination-btn"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="page-input-container">
                    <span>Page {currentPage} of {totalPages}</span>
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="pagination-btn"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <button 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages} 
                  className="pagination-btn"
                >
                  <i className="fas fa-step-forward"></i>
                </button>
            </div>
          )}
        </div>

        <div className="right-sidebar">
          <NotificationAlert />
        </div>
      </div>
      
      <footer>
        <p>Internships Click &copy; {new Date().getFullYear()} | Helping students find valuable career opportunities</p>
      </footer>
      
      {/* Mobile Navigation - UPDATED: Search button kept, Theme button fixed */}
      <nav className="mobile-nav">
          <div className="mobile-nav-list">
              <a href="#" className={`mobile-nav-item ${mobileView === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setMobileView('home'); }}>
                  <i className="fas fa-home mobile-nav-icon"></i><span>Home</span>
              </a>
              <a href="#" className="mobile-nav-item" onClick={(e) => { 
                e.preventDefault(); 
                const searchInput = document.querySelector('.mobile-search-input') as HTMLInputElement;
                searchInput?.focus();
              }}>
                  <i className="fas fa-search mobile-nav-icon"></i><span>Search</span>
              </a>
              {/* Notification Button */}
              <a href="#" className="mobile-nav-item" onClick={(e) => { 
                e.preventDefault(); 
                setShowNotificationPopup(true);
              }}>
                  <i className="fas fa-bell mobile-nav-icon"></i><span>Alerts</span>
              </a>
              {/* Theme button - Fixed: now properly toggles theme */}
              <a href="#" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); toggleTheme(); }}>
                  <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} mobile-nav-icon`}></i><span>Theme</span>
              </a>
              {/* Account button */}
              {user ? (
                <Link href="/account" className="mobile-nav-item">
                  <i className="fas fa-user mobile-nav-icon"></i>
                  <span>Account</span>
                </Link>
              ) : (
                <a 
                  href="#" 
                  className="mobile-nav-item" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setShowAuthModal(true);
                  }}
                >
                  <i className="fas fa-user mobile-nav-icon"></i>
                  <span>Account</span>
                </a>
              )}
          </div>
      </nav>

      {/* Simple Notification Popup */}
      {showNotificationPopup && (
        <div className="mobile-notification-popup active">
          <div className="mobile-notification-popup-content">
            <div className="mobile-notification-header">
              <h3>Internship Alert Features</h3>
              <button className="close-popup" onClick={() => setShowNotificationPopup(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mobile-notification-content">
              <div className="notification-description">
                <p>Our smart notification system helps you stay ahead in your internship search:</p>
                <ul>
                  {features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              <button onClick={handleExploreFeatures} className="submit-btn" style={{width: '100%'}}>
                <i className="fas fa-rocket"></i> Join Main List
              </button>
            </div>
          </div>
          <div className="mobile-notification-popup-backdrop" onClick={() => setShowNotificationPopup(false)}></div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}