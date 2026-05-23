import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SupabaseProvider } from './components/SupabaseProvider';
import { getInternships } from './lib/data';

// Function to get dynamic internship count
async function getInternshipCount(): Promise<number> {
  try {
    const internships = await getInternships();
    return internships.length;
  } catch (error) {
    console.error('Error fetching internship count:', error);
    return 1000; // Fallback number
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const internshipCount = await getInternshipCount();
  
  return {
    title: 'Internships Click - Find the Best Internship Opportunities in Canada',
    description: `Discover ${internshipCount}+ paid and unpaid internship opportunities across Canada. Search software engineering, data science, marketing, design, healthcare, business internships with real-time updates and smart filters.`,
    keywords: [
      // Primary keywords
      'internships',
      'internship opportunities',
      'internship canada',
      'canadian internships',
      'summer internships',
      'co-op programs',
      'student jobs',
      'entry level jobs',
      
      // Field-specific
      'software internships',
      'software engineering internships',
      'web development internships',
      'full stack developer internships',
      'frontend internships',
      'backend internships',
      'mobile app development internships',
      'data science internships',
      'data analyst internships',
      'machine learning internships',
      'AI internships',
      'artificial intelligence internships',
      'marketing internships',
      'digital marketing internships',
      'social media marketing internships',
      'content marketing internships',
      'design internships',
      'UX design internships',
      'UI design internships',
      'graphic design internships',
      'product design internships',
      'business internships',
      'finance internships',
      'accounting internships',
      'human resources internships',
      'sales internships',
      'healthcare internships',
      'medical internships',
      'pharmacy internships',
      'nursing internships',
      'research internships',
      
      // Location-based
      'toronto internships',
      'vancouver internships',
      'montreal internships',
      'calgary internships',
      'ottawa internships',
      'edmonton internships',
      'winnipeg internships',
      'quebec city internships',
      'hamilton internships',
      'kitchener internships',
      'waterloo internships',
      'london ontario internships',
      'victoria internships',
      'halifax internships',
      
      // Work type
      'remote internships',
      'work from home internships',
      'hybrid internships',
      'onsite internships',
      'in-person internships',
      'virtual internships',
      'online internships',
      
      // Company type
      'startup internships',
      'tech company internships',
      'corporate internships',
      'government internships',
      'nonprofit internships',
      'NGO internships',
      'small business internships',
      
      // Duration/type
      'summer 2024 internships',
      'summer 2025 internships',
      'fall internships',
      'winter internships',
      'spring internships',
      '4 month internships',
      '8 month internships',
      '12 month internships',
      '16 month internships',
      'part-time internships',
      'full-time internships',
      
      // Education level
      'university internships',
      'college internships',
      'undergraduate internships',
      'graduate internships',
      'masters internships',
      'PhD internships',
      'high school internships',
      'recent graduate internships',
      
      // Payment/compensation
      'paid internships',
      'unpaid internships',
      'stipend internships',
      'hourly wage internships',
      'salary internships',
      'co-op salary',
      'internship compensation',
      
      // Specific technologies
      'react internships',
      'javascript internships',
      'python internships',
      'java internships',
      'c++ internships',
      'typescript internships',
      'node.js internships',
      'angular internships',
      'vue.js internships',
      'aws internships',
      'azure internships',
      'google cloud internships',
      'docker internships',
      'kubernetes internships',
      'sql internships',
      'mongodb internships',
      'postgresql internships',
      
      // University/college specific
      'u of t internships',
      'university of toronto internships',
      'uwaterloo internships',
      'university of waterloo internships',
      'mcgill internships',
      'ubc internships',
      'university of british columbia internships',
      'u of a internships',
      'university of alberta internships',
      'queens university internships',
      'western university internships',
      'mcmaster internships',
      'york university internships',
      'carleton internships',
      'concordia internships',
      'ryerson internships',
      'toronto metropolitan university internships',
      
      // Industry terms
      'career development',
      'professional experience',
      'resume building',
      'skill development',
      'mentorship opportunities',
      'networking opportunities',
      'industry connections',
      'career advancement',
      
      // Job search terms
      'find internships',
      'search internships',
      'browse internships',
      'apply for internships',
      'internship applications',
      'internship listings',
      'internship database',
      'internship platform',
      
      // Company names (popular)
      'google internships canada',
      'microsoft internships canada',
      'amazon internships canada',
      'facebook internships canada',
      'meta internships canada',
      'apple internships canada',
      'shopify internships',
      'td bank internships',
      'rbc internships',
      'scotiabank internships',
      'bmo internships',
      'cibc internships',
      'bell internships',
      'telus internships',
      'rogers internships',
      'ibm internships canada',
      'oracle internships canada',
      'salesforce internships canada',
      'slack internships canada',
      'spotify internships canada',
    
      
      // Additional descriptors
      'best internships',
      'top internships',
      'high quality internships',
      'prestigious internships',
      'competitive internships',
      'exclusive internships'
    ],
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title: `Internships Click - ${internshipCount}+ Opportunities Across Canada`,
      description: `Find and apply for ${internshipCount}+ internship positions in software, data, marketing, design, business, and healthcare across Canada.`,
      type: 'website',
      url: 'https://internships.click',
      siteName: 'Internships Click',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Internships Click - Find Your Dream Internship',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Internships Click - Find Internships in Canada',
      description: `Discover ${internshipCount}+ internship opportunities across Canada`,
      images: ['/twitter-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'G-FLVC1R49B1',
    },
    alternates: {
      canonical: 'https://internships.click',
    },
    category: 'career',
    authors: [{ name: 'Internships Click Team' }],
    publisher: 'Internships Click',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}
  
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FLVC1R49B1"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FLVC1R49B1');
            
            // Enhanced ecommerce tracking for internship views/applications
            gtag('event', 'page_view', {
              'send_to': 'G-FLVC1R49B1',
              'page_title': document.title,
              'page_location': window.location.href
            });
          `}
        </Script>
        
        {/* Schema.org structured data for job postings */}
        <Script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Internships Click",
              "url": "https://internships.click",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://internships.click/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Find internship opportunities across Canada",
              "keywords": "internships, canada, software, data, marketing, design, business, healthcare",
              "publisher": {
                "@type": "Organization",
                "name": "Internships Click",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://internships.click/logo.png"
                }
              }
            })
          }}
        />
        
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
        
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        
        {/* Mobile-specific meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#3a7bd5" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Internships Click" />
        
        {/* Microsoft-specific meta tags */}
        <meta name="msapplication-TileColor" content="#3a7bd5" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* SEO enhancements */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="referrer" content="strict-origin-w  hen-cross-origin" />
        <meta name="format-detection" content="telephone=no" />
                
        {/* Favicon alternatives */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3a7bd5" />
        
        {/* Open Search */}
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Internships Click" />
      </head>
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        
        {/* Schema.org for current page (injected by client components) */}
        <div id="structured-data" style={{ display: 'none' }}></div>
      </body>
    </html>
  );
}