'use client';

import { Internship } from '../../.././lib/data';
import styles from './RoleDetail.module.css';

interface MobileRecommendedOpportunitiesProps {
  similarInternships: Internship[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MobileRecommendedOpportunities({
  similarInternships,
  currentPage,
  totalPages,
  onPageChange
}: MobileRecommendedOpportunitiesProps) {
  const itemsPerPage = 3;
  const paginatedInternships = similarInternships.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className={styles.similarRolesContainer}>
      <h3 className={styles.sectionTitleSmall}><i className="fas fa-lightbulb"></i> Similar Opportunities</h3>
      <div className={styles.similarRolesGrid}>
        {paginatedInternships.map(role => (
          <div key={role.id} className={styles.recommendedRoleCard}
               onClick={() => window.location.href = `/role/${role.id}`}>
            <div className={styles.recommendedRoleHeader}>
              <h4 className={styles.recommendedRoleTitle}>{role.title}</h4>
              <p className={styles.recommendedRoleCompany}>{role.company}</p>
            </div>
            <div className={styles.recommendedRoleBody}>
              <div className={styles.recommendedRoleDetails}>
                <div className={styles.recommendedRoleLocation}>
                  <i className="fas fa-map-marker-alt"></i>
                  {role.location?.split(',')[0] || 'Remote'}
                </div>
                <div className={styles.recommendedRoleStipend}>
                  {role.salary || 'Not specified'}
                </div>
              </div>
              <div className={styles.recommendedRoleSkills}>
                {role.skills?.slice(0, 3).map((skill: string) => (
                  <span key={skill} className={styles.recommendedSkillTag}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className={styles.mobilePaginationControls}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.mobilePaginationBtn}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className={styles.mobilePageIndicator}>
            <span>{currentPage} / {totalPages}</span>
          </div>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={styles.mobilePaginationBtn}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}