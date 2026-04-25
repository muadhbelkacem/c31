import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
        '/_next/',
        '/static/'
      ],
    },
    sitemap: 'https://www.internships.click/sitemap.xml', // badli b domain name t3na
  }
}