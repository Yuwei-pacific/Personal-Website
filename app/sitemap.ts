import { MetadataRoute } from 'next'
import { isSanityConfigured, sanityClient } from '@/lib/sanity'
import groq from 'groq'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://yuweili.site'

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
    if (isSanityConfigured() && sanityClient) {
        try {
            const projects = await sanityClient.fetch<Array<{ slug: string; _updatedAt: string }>>(
                groq`*[_type == "project" && defined(slug.current)]{
          "slug": slug.current,
          _updatedAt
        }`
            )

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
    }

    return routes
}
