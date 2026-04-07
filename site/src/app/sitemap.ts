import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
	return [{ url: 'https://breathe.liiift.studio', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
