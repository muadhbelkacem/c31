'use client';

interface NotificationAlertProps {
  className?: string;
}

export default function NotificationAlert({ className = '' }: NotificationAlertProps) {
  const features = [
    'Get alerts from best internship opportunities',
    'Never miss new opportunities matching your skills',
    'Instant notifications when roles are posted',
    'Customize by category and skills',
  ];

  const handleExploreFeatures = () => {
    window.open('https://join.internships.click/', '_blank');
  };

  return (
    <div className={`notification-card ${className}`}>
      <h3 className="section-title-small">Internship Alert Features</h3>
      <div className="notification-description">
        <p>Our smart notification system helps you stay ahead in your internship search:</p>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleExploreFeatures} className="submit-btn">
        <i className="fas fa-rocket"></i> Join Main List
      </button>
    </div>
  );
}