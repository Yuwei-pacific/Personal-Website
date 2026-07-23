import { MetadataRoute } from 'next'
import { sanityClient } from "@/sanity/client";
import { PROJECT_SITEMAP_QUERY } from "@/sanity/queries";

const baseUrl = 'https://www.yuweidesign.com'
const fallbackLastModified = new Date('2026-01-01')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 动态获取项目页面
    try {
        const projects = await sanityClient.fetch(PROJECT_SITEMAP_QUERY)
        const validProjects = projects.filter((project): project is { slug: string; _updatedAt: string } => Boolean(project.slug))
        const latestProjectDate = validProjects.reduce((latest, project) => {
            const updatedAt = new Date(project._updatedAt)
            return updatedAt > latest ? updatedAt : latest
        }, fallbackLastModified)

        // 静态页面：lastModified 取内容最新更新时间，避免每次构建都伪更新
        const routes = [
            {
                url: baseUrl,
                lastModified: latestProjectDate,
                changeFrequency: 'monthly' as const,
                priority: 1,
            },
        ]

        const projectRoutes = validProjects.map((project) => ({
            url: `${baseUrl}/projects/${project.slug}`,
            lastModified: new Date(project._updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }))

        routes.push(...projectRoutes)
        return routes
    } catch (error) {
        console.error('Failed to fetch projects for sitemap', error)
    }

    return [
        {
            url: baseUrl,
            lastModified: fallbackLastModified,
            changeFrequency: 'monthly' as const,
            priority: 1,
        },
    ]
}
