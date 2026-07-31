import { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/site-metadata'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/studio'],
        },
        sitemap: absoluteUrl('/sitemap.xml'),
    }
}
