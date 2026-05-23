import { getInternships } from '../lib/data';
import { InternshipPageWithSearchParams } from '../components/InternshipPageWithSearchParams';

export default async function HomePage() {
  const internships = await getInternships();

  return (
    <>
      <div className="desktop-container">
        <InternshipPageWithSearchParams initialInternships={internships} />
      </div>
      
      <style>{`
        .desktop-container {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .desktop-container {
            padding: 0;
            max-width: none;
          }
        }
        
        .loading-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          gap: 20px;
          background: var(--bg-primary);
        }
        
        .loading-spinner {
          font-size: 2.5rem;
          color: var(--button-bg);
        }
        
        .loading-text {
          font-size: 1.1rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
      `}</style>
    </>
  );
}