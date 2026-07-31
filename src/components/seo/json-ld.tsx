// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_NAME,
  SITE_ROLE,
  SITE_URL,
  SOCIAL_LINKS,
  absoluteUrl,
} from "@/lib/site-metadata";

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
    name: SITE_AUTHOR,
    url: SITE_URL,
    sameAs: SOCIAL_LINKS.map((link) => link.href),
    jobTitle: SITE_ROLE,
    description: SITE_DESCRIPTION,
    email: `mailto:${SITE_EMAIL}`,
}

// 网站结构化数据
export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: absoluteUrl('/Profile_Yuwei.webp'),
    logo: absoluteUrl('/Logo.svg'),
    author: {
        '@type': 'Person',
        name: SITE_AUTHOR,
    },
    publisher: {
        '@type': 'Organization',
        name: SITE_AUTHOR,
        logo: {
            '@type': 'ImageObject',
            url: absoluteUrl('/Logo.svg'),
        },
    },
}
