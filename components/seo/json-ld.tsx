// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function JsonLd({ data }: { data: Record<string, any> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}

// 个人结构化数据：用于增强 E-E-A-T 信号
export const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Yuwei Li',
    url: 'https://www.yuweidesign.com',
    sameAs: [
        'https://github.com/Yuwei-pacific',
        'https://www.linkedin.com/in/yuwei081/',
        'https://www.instagram.com/yuwei081/',
    ],
    jobTitle: 'Designer & Developer',
    description: 'Designer, Developer, and Creative Technologist',
}

// 网站结构化数据
export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Yuwei Design',
    url: 'https://www.yuweidesign.com',
    description: 'Portfolio and background of Yuwei Li - Designer, Developer, and Creative Technologist.',
    image: 'https://www.yuweidesign.com/Profile_Yuwei.webp',
    logo: 'https://www.yuweidesign.com/Logo.svg',
    author: {
        '@type': 'Person',
        name: 'Yuwei Li',
    },
    publisher: {
        '@type': 'Organization',
        name: 'Yuwei Li',
        logo: {
            '@type': 'ImageObject',
            url: 'https://www.yuweidesign.com/Logo.svg',
        },
    },
}
