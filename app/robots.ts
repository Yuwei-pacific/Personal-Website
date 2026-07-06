import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/studio'],
        },
        sitemap: 'https://www.yuweidesign.com/sitemap.xml',
    }
}
