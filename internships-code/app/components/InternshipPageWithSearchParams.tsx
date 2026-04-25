'use client';

import { Suspense } from 'react';
import { InternshipPage } from './InternshipPage';
import type { Internship } from '../lib/data';

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
      <p className="loading-text">Loading internship data...</p>
    </div>
  );
}

// This component wraps InternshipPage with Suspense
export function InternshipPageWithSearchParams({ 
  initialInternships 
}: { 
  initialInternships: Internship[] 
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InternshipPage initialInternships={initialInternships} />
    </Suspense>
  );
}