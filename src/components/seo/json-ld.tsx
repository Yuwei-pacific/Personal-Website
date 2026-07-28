// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
import { SITE_DESCRIPTION, SITE_ROLE } from "@/lib/site-metadata";

/**
 * JSON.stringify does not make data safe to embed in a script element:
 * CMS text containing `</script>` would otherwise close the JSON-LD node.
 */
export function serializeJsonLd(data: Record<string, unknown>) {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
    );
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
    jobTitle: SITE_ROLE,
    description: SITE_DESCRIPTION,
}

// 网站结构化数据
export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Yuwei Design',
    url: 'https://www.yuweidesign.com',
    description: SITE_DESCRIPTION,
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
