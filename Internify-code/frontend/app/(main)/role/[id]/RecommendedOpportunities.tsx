'use client';

import { Internship } from '../../.././lib/data';
import styles from './RoleDetail.module.css';

interface RecommendedOpportunitiesProps {
  similarInternships: Internship[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RecommendedOpportunities({
  similarInternships,
  currentPage,
  totalPages,
  onPageChange
}: RecommendedOpportunitiesProps) {
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
      <h3 className={styles.sectionTitleSmall}><i className="fas fa-lightbulb"></i> Recommended Opportunities</h3>
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
      
      {/* Desktop Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className={styles.paginationBtn}>
            <i className="fas fa-step-backward"></i>
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.paginationBtn}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className={styles.pageInputContainer}>
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={styles.paginationBtn}>
            <i className="fas fa-chevron-right"></i>
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className={styles.paginationBtn}>
            <i className="fas fa-step-forward"></i>
          </button>
        </div>
      )}
    </div>
  );
}