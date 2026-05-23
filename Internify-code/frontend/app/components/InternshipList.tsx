'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Internship } from '../lib/data';

// RoleCard component defined within the same file for simplicity
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
            <span>{internship.salary || 'Not specified'}</span>
          </div>
        </div>
        <div className="role-description">
            <p>{internship.description.substring(0, 150)}...</p>
        </div>
        {visibleSkills.length > 0 && (
          <div className="role-skills">
            <div className="skills-container">
              {visibleSkills.map(skill => (
                <span key={skill} className="skill-tag">{skill}</span>
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

export function InternshipList({ initialInternships }: { initialInternships: Internship[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredInternships = useMemo(() => {
    if (!searchQuery) return initialInternships;
    const lowercasedQuery = searchQuery.toLowerCase();
    return initialInternships.filter(internship =>
      internship.title.toLowerCase().includes(lowercasedQuery) ||
      internship.company.toLowerCase().includes(lowercasedQuery) ||
      internship.location.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, initialInternships]);

  const totalRoles = initialInternships.length;
  const totalCompanies = new Set(initialInternships.map(i => i.company)).size;

  return (
    <div className="main-content">
      <div className="left-sidebar">
        <div className="stats-container">
          <h3 className="section-title-small">Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-number">{totalRoles}</span><span className="stat-label">Total Roles</span></div>
            <div className="stat-card"><span className="stat-number">{totalCompanies}</span><span className="stat-label">Companies</span></div>
            {/* Add other stats as needed */}
          </div>
        </div>
      </div>

      <div className="roles-container">
        <h2 className="section-title">Available Roles</h2>
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              id="searchInput"
              className="search-input"
              placeholder="Search by company, role, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
             <input
              type="text"
              className="mobile-search-input"
              id="mobileSearchInput"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="roles-grid" id="rolesGridDesktop">
          {filteredInternships.map(internship => (
            <RoleCard key={internship.id} internship={internship} />
          ))}
        </div>
      </div>

      <div className="right-sidebar">
        {/* Notification form can be its own component if it gets more complex */}
        <div className="notification-card">
          <h3 className="section-title-small">Get New Role Alerts</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group"><input type="email" placeholder="Enter your email" required /></div>
            <button type="submit" className="submit-btn"><i className="fas fa-bell"></i> Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  );
}