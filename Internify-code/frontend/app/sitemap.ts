import { MetadataRoute } from 'next'
import { getInternships } from './lib/data'
import { Internship } from './lib/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.internships.click/' // Replace before deploying
  
  // Get all internships for dynamic URLs with proper typing
  let internships: Internship[] = []
  try {
    internships = await getInternships()
  } catch (error) {
    console.error('Error fetching internships for sitemap:', error)
  }

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    }
  ]

  // Dynamic internship pages
  const internshipPages = internships.map((internship) => ({
    url: `${baseUrl}role/${internship.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category pages (based on your internship categories)
  const categories = ['software', 'data-ai', 'design', 'marketing', 'business']
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}categories/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Company pages (extract unique companies)
  const companies = [...new Set(internships.map(internship => internship.company))].slice(0, 50) // Limit to top 50 companies
  const companyPages = companies.map((company) => ({
    url: `${baseUrl}companies/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Location pages (extract unique locations)
  const locations = [...new Set(internships.map(internship => internship.location))].slice(0, 30) // Limit to top 30 locations
  const locationPages = locations.map((location) => ({
    url: `${baseUrl}locations/${encodeURIComponent(location.toLowerCase().replace(/\s+/g, '-').replace(/,/g, ''))}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...internshipPages,
    ...categoryPages,
    ...companyPages,
    ...locationPages,
  ]
}