// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
import {
  SITE_AUTHOR,
  SITE_EMAIL,
  SITE_NAME,
  SITE_ROLE,
  SOCIAL_LINKS,
  absoluteUrl,
  getSiteMetadata,
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
        '@id': absoluteUrl('/#person'),
        name: SITE_AUTHOR,
        url: absoluteUrl(),
        sameAs: SOCIAL_LINKS.map((link) => link.href),
        jobTitle: SITE_ROLE,
        description: metadata.description,
        email: `mailto:${SITE_EMAIL}`,
        inLanguage: locale,
    };
}

// 网站结构化数据
export const websiteSchema = () => {
    const person = {
        '@type': 'Person',
        '@id': absoluteUrl('/#person'),
        name: SITE_AUTHOR,
        url: absoluteUrl(),
    };

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        name: SITE_NAME,
        alternateName: SITE_AUTHOR,
        url: absoluteUrl(),
        inLanguage: ['it', 'en'],
        image: absoluteUrl('/Profile_Yuwei.webp'),
        logo: absoluteUrl('/Logo.svg'),
        author: person,
        publisher: person,
    };
}
