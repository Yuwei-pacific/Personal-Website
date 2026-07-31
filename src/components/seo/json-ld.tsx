// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
import {
  SITE_AUTHOR,
  SITE_EMAIL,
  SITE_NAME,
  SITE_ROLE,
  SOCIAL_LINKS,
  absoluteUrl,
  getSiteMetadata,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";
import type { Locale } from "@/i18n/config";

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
export const personSchema = (locale: Locale) => {
    const metadata = getSiteMetadata(locale);

    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: SITE_AUTHOR,
        url: localizedAbsoluteUrl(locale),
        sameAs: SOCIAL_LINKS.map((link) => link.href),
        jobTitle: SITE_ROLE,
        description: metadata.description,
        email: `mailto:${SITE_EMAIL}`,
        inLanguage: locale,
    };
}

// 网站结构化数据
export const websiteSchema = (locale: Locale) => {
    const metadata = getSiteMetadata(locale);

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: localizedAbsoluteUrl(locale),
        description: metadata.description,
        inLanguage: locale,
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
    };
}
