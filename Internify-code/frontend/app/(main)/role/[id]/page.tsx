// app/(main)/role/[id]/page.tsx
'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import type { Internship } from '../../../lib/data';
import DesktopHeader from '../../../components/DesktopHeader';
import SharePopup from '../../../components/SharePopup';
import RecommendedOpportunities from './RecommendedOpportunities';
import MobileRecommendedOpportunities from './MobileRecommendedOpportunities';
import styles from './RoleDetail.module.css';
import { useSavedRoles } from '../../../lib/useSavedRoles';
import FormattedDescription from './FormattedDescription';
import { useSupabase } from '../../../components/SupabaseProvider';
import AuthModal from '../../../components/AuthModal';
import { supabase } from '../../../lib/supabase-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Cache for similar internships to avoid duplicate API calls
const similarInternshipsCache = new Map<string, Internship[]>();

export default function RolePage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [similarInternships, setSimilarInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const itemsPerPage = 3;
  
  const { saveRole, unsaveRole, isRoleSaved } = useSavedRoles();
  const { user } = useSupabase();

  const isSaved = internship ? isRoleSaved(internship.id) : false;

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

  // Resolve params
  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  // Function to validate internship (ensure it's not a bad entry)
  const isValidInternship = useCallback((internship: Internship): boolean => {
    return !!internship && 
           !!internship.title && 
           internship.title !== 'Position Not Specified' && 
           !!internship.company && 
           internship.company !== 'Company Not Specified' &&
           internship.title.trim() !== '' &&
           internship.company.trim() !== '';
  }, []);

  // Function to fetch similar internships with caching and filtering
  const fetchSimilarInternships = useCallback(async (currentInternship: Internship) => {
    // Check cache first
    const cacheKey = currentInternship.id;
    if (similarInternshipsCache.has(cacheKey)) {
      setSimilarInternships(similarInternshipsCache.get(cacheKey)!);
      return;
    }

    try {
      const response = await fetch('/api/internship');
      if (!response.ok) {
        throw new Error('Failed to fetch internships');
      }
      const allInternships: Internship[] = await response.json();
      
      // Filter out bad entries and current internship
      const validInternships = allInternships.filter(item => 
        isValidInternship(item) && 
        item.id !== currentInternship.id
      );
      
      // Find similar internships (same category or skills)
      const findSimilar = (): Internship[] => {
        // Try category match first
        const sameCategory = validInternships.filter(item => 
          item.category === currentInternship.category
        );
        
        if (sameCategory.length >= 3) {
          return sameCategory.slice(0, 6);
        }
        
        // Try skill overlap
        const withSkillOverlap = validInternships.filter(item => 
          item.skills.some(skill => 
            currentInternship.skills.includes(skill)
          )
        );
        
        if (withSkillOverlap.length >= 3) {
          return withSkillOverlap.slice(0, 6);
        }
        
        // Fallback: random valid internships
        return validInternships
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
      };
      
      const similar = findSimilar();
      
      // Cache the results
      similarInternshipsCache.set(cacheKey, similar);
      setSimilarInternships(similar);
    } catch (err) {
      console.error('Error fetching similar internships:', err);
      // Fallback: use other valid internships
      try {
        const response = await fetch('/api/internship');
        if (response.ok) {
          const allInternships: Internship[] = await response.json();
          const validInternships = allInternships.filter(item => 
            isValidInternship(item) && 
            item.id !== currentInternship.id
          ).slice(0, 6);
          setSimilarInternships(validInternships);
        }
      } catch {
        // Last resort: empty array
        setSimilarInternships([]);
      }
    }
  }, [isValidInternship]);

  // Fetch internship data
  useEffect(() => {
    if (!id) return;
    
    async function fetchInternship() {
      try {
        const response = await fetch(`/api/internship/${id}`);
        if (!response.ok) {
          throw new Error('Role not found');
        }
        const data: Internship = await response.json();
        
        // Validate the internship isn't a bad entry
        if (!isValidInternship(data)) {
          console.warn('Invalid internship data found:', data);
          setError(true);
          return;
        }
        
        setInternship(data);
        // Fetch similar internships
        fetchSimilarInternships(data);
      } catch (err) {
        console.error('Error fetching internship:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInternship();
  }, [id, fetchSimilarInternships, isValidInternship]);

  const handleSave = async () => {
    if (!internship) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isSaved) {
        const success = await unsaveRole(internship.id);
        if (success) {
          console.log('Internship removed from saved list');
        } else {
          console.error('Error removing internship');
        }
      } else {
        const success = await saveRole(internship);
        if (success) {
          console.log('Internship saved to your list');
        } else {
          console.error('Error saving internship');
        }
      }
    } catch (error) {
      console.error('Error in save operation:', error);
    }
  };

  const handleShare = () => {
    setShowSharePopup(true);
  };

  // Calculate pagination for similar roles
  const totalPages = Math.max(1, Math.ceil(similarInternships.length / itemsPerPage));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className={styles.roleDetailPage}>
        <div className={styles.container}>
          <DesktopHeader />
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i> Loading role details...
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !internship) {
    return notFound();
  }

  return (
    <div className={styles.roleDetailPage}>
      <DesktopHeader />
      
      <div className={styles.container}>
        {/* Desktop layout */}
        <div className={styles.mainContent}>
          <div className={styles.rolesContainerExpanded}>
            <div className={styles.roleModalCard}>
              <div className={styles.roleHeaderBanner}>
                <h2 className={styles.roleTitleLarge}>{internship.title}</h2>
                <p className={styles.roleCompanyLarge}>{internship.company}</p>
              </div>
              
              <div className={styles.roleContentBody}>
                <div className={styles.roleDetailsGridExpanded}>
                  <div className={styles.roleDetailBox}>
                    <h3 className={styles.roleDetailTitle}>Position Details</h3>
                    
                    <div className={styles.roleDetailItem}>
                      <i className="fas fa-map-marker-alt role-detail-icon"></i>
                      <div>
                        <span className={styles.roleDetailLabel}>Location:</span>
                        <span className={styles.roleDetailValue}>{internship.location}</span>
                      </div>
                    </div>
                    
                    <div className={styles.roleDetailItem}>
                      <i className="fas fa-calendar role-detail-icon"></i>
                      <div>
                        <span className={styles.roleDetailLabel}>Duration:</span>
                        <span className={styles.roleDetailValue}>{internship.duration || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div className={styles.roleDetailItem}>
                      <i className="fas fa-money-bill-wave role-detail-icon"></i>
                      <div>
                        <span className={styles.roleDetailLabel}>Compensation:</span>
                        <span className={styles.roleDetailValue}>{internship.salary || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div className={styles.roleDetailItem}>
                      <i className="fas fa-briefcase role-detail-icon"></i>
                      <div>
                        <span className={styles.roleDetailLabel}>Category:</span>
                        <span className={styles.roleDetailValue}>{internship.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.roleDetailBox}>
                    <h3 className={styles.roleDetailTitle}>Skills Required</h3>
                    <div className={styles.skillsContainer}>
                      {internship.skills && internship.skills.length > 0 ? (
                        internship.skills.map(skill => (
                          <span key={skill} className={styles.skillTag}>{skill}</span>
                        ))
                      ) : (
                        <span className={styles.noSkills}>No specific skills listed</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={styles.roleDescriptionBox}>
                  <h3 className={styles.roleDetailTitle}>Role Description</h3>
                  <div className={styles.roleDescriptionContent}>
                    <FormattedDescription content={internship.description} />
                  </div>
                </div>
                
                <div className={styles.roleApplySection}>
                  <h3 className={styles.roleDetailTitle}>How to Apply</h3>
                  <p>Click the button below to apply directly on the company&apos;s website</p>
                  <a 
                    href={internship.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.applyButtonLarge}
                    aria-label={`Apply for ${internship.title} at ${internship.company}`}
                  >
                    <i className="fas fa-paper-plane"></i> Apply For This Role
                  </a>
                </div>
              </div>
              
              <div className={styles.roleFooter}>
                <div className={styles.actionButtonRow}>
                  <button 
                    className={styles.actionButton} 
                    onClick={handleShare}
                    aria-label="Share this role"
                  >
                    <i className="fas fa-share-alt"></i> Share
                  </button>
                  <button 
                    className={`${styles.actionButton} ${isSaved ? styles.saved : ''}`} 
                    onClick={handleSave}
                    aria-label={isSaved ? "Remove from saved list" : "Save to your list"}
                  >
                    <i className={`fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark'}`}></i> 
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Similar Roles */}
          <div className={styles.rightSidebar}>
            <RecommendedOpportunities
              similarInternships={similarInternships}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
        
        {/* Mobile layout */}
        <div className={styles.mobileRoleDetails}>
          <div className={styles.mobileRoleModal}>
            <div className={styles.mobileRoleHeader}>
              <h2 className={styles.mobileRoleTitle}>{internship.title}</h2>
              <p className={styles.mobileRoleCompany}>{internship.company}</p>
            </div>
            
            <div className={styles.mobileDetailsGrid}>
              <div className={styles.mobileDetailSection}>
                <h3 className={styles.mobileDetailTitle}>Position Details</h3>
                
                <div className={styles.mobileRoleDetail}>
                  <i className="fas fa-map-marker-alt mobile-role-icon"></i>
                  <div>
                    <span className={styles.mobileDetailLabel}>Location:</span>
                    <span className={styles.mobileDetailValue}>{internship.location}</span>
                  </div>
                </div>
                
                <div className={styles.mobileRoleDetail}>
                  <i className="fas fa-calendar mobile-role-icon"></i>
                  <div>
                    <span className={styles.mobileDetailLabel}>Duration:</span>
                    <span className={styles.mobileDetailValue}>{internship.duration || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className={styles.mobileRoleDetail}>
                  <i className="fas fa-money-bill-wave mobile-role-icon"></i>
                  <div>
                    <span className={styles.mobileDetailLabel}>Compensation:</span>
                    <span className={styles.mobileDetailValue}>{internship.salary || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className={styles.mobileRoleDetail}>
                  <i className="fas fa-briefcase mobile-role-icon"></i>
                  <div>
                    <span className={styles.mobileDetailLabel}>Category:</span>
                    <span className={styles.mobileDetailValue}>{internship.category}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.mobileDetailSection}>
                <h3 className={styles.mobileDetailTitle}>Skills Required</h3>
                <div className={styles.mobileSkillsContainer}>
                  {internship.skills && internship.skills.length > 0 ? (
                    internship.skills.map(skill => (
                      <span key={skill} className={styles.mobileSkillTag}>{skill}</span>
                    ))
                  ) : (
                    <span className={styles.noSkills}>No specific skills listed</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.mobileDescriptionSection}>
              <h3 className={styles.mobileDetailTitle}>Role Description</h3>
              <div className={styles.descriptionContent}>
                <FormattedDescription content={internship.description} />
              </div>
            </div>
            
            <div className={styles.mobileRoleFooter}>
              <a 
                href={internship.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.mobileApplyBtn}
                aria-label={`Apply for ${internship.title} at ${internship.company}`}
              >
                <i className="fas fa-paper-plane"></i> Apply For This Role
              </a>
              
              <div className={styles.mobileRoleActions}>
                <button 
                  className={styles.mobileActionBtn} 
                  onClick={handleSave}
                  aria-label={isSaved ? "Remove from saved list" : "Save to your list"}
                >
                  <i className={`fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark'} ${styles.mobileActionIcon}`}></i>
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
                <button 
                  className={styles.mobileActionBtn} 
                  onClick={handleShare}
                  aria-label="Share this role"
                >
                  <i className={`fas fa-share-alt ${styles.mobileActionIcon}`}></i>
                  <span>Share</span>
                </button>
                <Link href="/" className={styles.mobileActionBtn} aria-label="Back to home">
                  <i className={`fas fa-arrow-left ${styles.mobileActionIcon}`}></i>
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Similar Roles with Pagination */}
        <div className={styles.mobileSimilarRoles}>
          <MobileRecommendedOpportunities
            similarInternships={similarInternships}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <footer className={styles.footer}>
          <p>Internships Click &copy; {new Date().getFullYear()} | Helping students find valuable career opportunities</p>
        </footer>
      </div>

      {/* Share Popup Component */}
      {showSharePopup && (
        <SharePopup
          isOpen={showSharePopup}
          onClose={() => setShowSharePopup(false)}
          internship={internship}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Mobile Navigation - UPDATED: Search replaced with Share, Theme button fixed */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavList}>
          <Link href="/" className={styles.mobileNavItem} aria-label="Home">
            <i className="fas fa-home mobile-nav-icon"></i>
            <span>Home</span>
          </Link>
          {/* Share button instead of Search */}
          <button 
            className={styles.mobileNavItem} 
            onClick={handleShare}
            aria-label="Share this role"
          >
            <i className="fas fa-share-alt mobile-nav-icon"></i>
            <span>Share</span>
          </button>
          {/* Theme button - fixed */}
          <button 
            className={styles.mobileNavItem} 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} mobile-nav-icon`}></i>
            <span>Theme</span>
          </button>
          {/* Account button */}
          {user ? (
            <Link href="/account" className={styles.mobileNavItem} aria-label="Account">
              <i className="fas fa-user mobile-nav-icon"></i>
              <span>Account</span>
            </Link>
          ) : (
            <button 
              className={styles.mobileNavItem} 
              onClick={(e) => { 
                e.preventDefault(); 
                setShowAuthModal(true);
              }}
              aria-label="Sign in"
            >
              <i className="fas fa-user mobile-nav-icon"></i>
              <span>Account</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}