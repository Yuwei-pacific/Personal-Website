import { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity'
import { PROJECT_SITEMAP_QUERY } from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.yuweidesign.com'

    // 静态页面
    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 1,
        },
    ]

    // 动态获取项目页面
    try {
        const projects = await sanityClient.fetch(PROJECT_SITEMAP_QUERY)

        const projectRoutes = projects.map((project) => ({
            url: `${baseUrl}/projects/${project.slug}`,
            lastModified: new Date(project._updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }))

        routes.push(...projectRoutes)
    } catch (error) {
        console.error('Failed to fetch projects for sitemap', error)
    }

    return routes
}
