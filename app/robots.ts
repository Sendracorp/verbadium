import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://verbadium.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // no SEO value + private — keep crawlers focused on course/marketing pages
      disallow: ['/admin', '/account', '/api/', '/login', '/signup', '/forgot-password', '/reset-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
