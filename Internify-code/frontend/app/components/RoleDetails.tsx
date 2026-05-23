import { Internship } from '../lib/data';

export function RoleDetails({ internship }: { internship: Internship }) {
    return (
        <div className="roles-container">
            <div className="role-modal-style-card">
                <div className="role-header-banner">
                    <h2 className="role-title-large">{internship.title}</h2>
                    <p className="role-company-large">{internship.company}</p>
                </div>

                <div className="role-content-body">
                    <div className="role-details-grid">
                        <div className="role-detail-box">
                            <h3 className="role-detail-title">Position Details</h3>
                            <div className="role-detail-item">
                                <i className="fas fa-map-marker-alt role-detail-icon"></i>
                                <div><span className="role-detail-label">Location:</span> <span className="role-detail-value">{internship.location}</span></div>
                            </div>
                            <div className="role-detail-item">
                                <i className="fas fa-money-bill-wave role-detail-icon"></i>
                                <div><span className="role-detail-label">Compensation:</span> <span className="role-detail-value">{internship.salary || 'Not specified'}</span></div>
                            </div>
                            <div className="role-detail-item">
                                <i className="fas fa-briefcase role-detail-icon"></i>
                                <div><span className="role-detail-label">Category:</span> <span className="role-detail-value">{internship.category}</span></div>
                            </div>
                        </div>
                        <div className="role-detail-box">
                            <h3 className="role-detail-title">Skills Required</h3>
                            <div className="skills-container">
                                {internship.skills.length > 0 ? internship.skills.map(skill => (
                                    <span key={skill} className="skill-tag">{skill}</span>
                                )) : <p>No specific skills listed.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="role-description-box">
                        <h3 className="role-detail-title">Role Description</h3>
                        <div className="role-description-content">
                            <p>{internship.description}</p>
                        </div>
                    </div>

                    <div className="role-apply-section">
                        <h3 className="role-detail-title">How to Apply</h3>
                        <a href={internship.link} target="_blank" rel="noopener noreferrer" className="apply-button-large">
                            <i className="fas fa-paper-plane"></i> Apply For This Role
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
