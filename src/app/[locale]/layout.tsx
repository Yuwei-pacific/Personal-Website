import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd, websiteSchema } from "@/components/seo/json-ld";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  SITE_NAME,
  SITE_TITLE,
  getSiteMetadata,
  languageAlternates,
  localizedAbsoluteUrl,
} from "@/lib/site-metadata";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};

  const metadata = getSiteMetadata(rawLocale);

  return {
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: metadata.description,
    keywords: metadata.keywords,
    alternates: {
      canonical: localizedAbsoluteUrl(rawLocale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      locale: metadata.openGraphLocale,
      alternateLocale: [metadata.alternateOpenGraphLocale],
      url: localizedAbsoluteUrl(rawLocale),
      title: SITE_TITLE,
      description: metadata.description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: metadata.description,
      creator: "@yuweili",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  // Evaluate the dictionary here so unsupported locales fail before rendering any page.
  getDictionary(rawLocale);

  return (
    <>
      <JsonLd data={websiteSchema(rawLocale)} />
      {children}
    </>
  );
}
