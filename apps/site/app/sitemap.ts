import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/site-config';

const ROUTES = [
  '/',
  '/services',
  '/services/digital-presence',
  '/services/digital-growth',
  '/services/ai-automation',
  '/about',
  '/work',
  '/knowledge',
  '/knowledge/document-ai-pipeline',
  '/knowledge/ai-receptionist-webchat',
  '/contact',
  '/privacy',
  '/terms',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
