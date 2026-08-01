// JSON-LD 结构化数据组件：帮助搜索引擎理解页面内容
import {
  SITE_ADDRESS_LOCALITY,
  SITE_AUTHOR,
  SITE_COUNTRY_CODE,
  SITE_EMAIL,
  SITE_NAME,
  SITE_ROLE,
  SOCIAL_LINKS,
  absoluteUrl,
  getSiteMetadata,
} from "@/lib/site-metadata";
import type { Locale } from "@/i18n/config";

// 把「Yuwei Li」这个高度同名的实体连到 Google 已高度确信的节点上（学校、城市、
// 语言、主题）。每一项都能在 /about 或项目页上找到对应的可见内容，不写无法佐证的东西。
const ALUMNI_OF = [
  {
    '@type': 'CollegeOrUniversity',
    name: 'Politecnico di Milano',
    sameAs: 'https://www.polimi.it/',
  },
  {
    '@type': 'CollegeOrUniversity',
    name: 'Accademia di Belle Arti di Firenze',
    sameAs: 'https://www.accademia.firenze.it/',
  },
] as const;

// schema.org 的 Person 用 knowsLanguage（不是 inLanguage）。与 /about 的语言行一致。
const KNOWS_LANGUAGE = [
  { '@type': 'Language', name: 'Chinese', alternateName: 'zh' },
  { '@type': 'Language', name: 'English', alternateName: 'en' },
  { '@type': 'Language', name: 'Italian', alternateName: 'it' },
] as const;

// 主题词保持英文且不随 locale 变化：同一字符串更利于实体归并。
const KNOWS_ABOUT = [
  'Communication Design',
  'Visual Identity',
  'UX/UI Design',
  'Interaction Design',
  'Design Systems',
  'Frontend Development',
  'Next.js',
  'React',
  'Sanity CMS',
] as const;

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
        address: {
            '@type': 'PostalAddress',
            addressLocality: SITE_ADDRESS_LOCALITY[locale],
            addressCountry: SITE_COUNTRY_CODE,
        },
        alumniOf: ALUMNI_OF,
        knowsLanguage: KNOWS_LANGUAGE,
        knowsAbout: KNOWS_ABOUT,
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
