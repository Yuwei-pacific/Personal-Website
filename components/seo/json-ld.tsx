// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
export function JsonLd({ data }: { data: Record<string, any> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}

// 个人/组织结构化数据
export const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Yuwei Li',
    url: 'https://yuweili.site',
    sameAs: [
        'https://github.com/yuweili',
        'https://linkedin.com/in/yuweili',
        'https://instagram.com/yuweili',
    ],
    jobTitle: 'Designer & Developer',
    description: 'Designer, Developer, and Creative Technologist',
}

// 网站结构化数据
export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Yuwei Li Portfolio',
    url: 'https://yuweili.site',
    description: 'Portfolio and background of Yuwei Li - Designer, Developer, and Creative Technologist.',
    image: 'https://yuweili.site/Profile_Yuwei.webp',
    logo: 'https://yuweili.site/Logo.svg',
    author: {
        '@type': 'Person',
        name: 'Yuwei Li',
    },
    publisher: {
        '@type': 'Organization',
        name: 'Yuwei Li',
        logo: {
            '@type': 'ImageObject',
            url: 'https://yuweili.site/Logo.svg',
        },
    },
}
