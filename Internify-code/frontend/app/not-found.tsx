'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The internship role you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/" className="back-home-btn">
          <i className="fas fa-home"></i> Back to Home
        </Link>
      </div>
      
      <style jsx>{`
        .not-found-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-color);
          text-align: center;
          padding: 1rem;
        }
        
        .not-found-content h1 {
          font-size: 6rem;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }
        
        .not-found-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        .not-found-content p {
          color: var(--text-light);
          margin-bottom: 2rem;
        }
        
        .back-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: var(--primary-color);
          color: white;
          border-radius: var(--border-radius);
          font-weight: 500;
          transition: background-color var(--transition-speed);
        }
        
        .back-home-btn:hover {
          background-color: var(--primary-color-light);
        }
      `}</style>
    </div>
  );
}