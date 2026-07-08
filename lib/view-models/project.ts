import type { ProjectDetail, ProjectGalleryItem, ProjectLink } from "@/types";
import { getSafeHref } from "@/lib/safe-url";
import type { PROJECT_QUERYResult } from "@/sanity/sanity.types";
import { blocks, optionalText, stringList, text } from "./utils";

const normalizeLinks = (links: NonNullable<NonNullable<PROJECT_QUERYResult>["links"]>): ProjectLink[] =>
  links.map((link, index) => {
    const originalUrl = optionalText(link.url);
    const href = getSafeHref(originalUrl);
    return {
      key: link._key || `link-${index}`,
      label: text(link.label, href || originalUrl || "Link"),
      href,
      originalUrl,
    };
  });

const normalizeGallery = (
  gallery: NonNullable<PROJECT_QUERYResult>["gallery"]
): ProjectGalleryItem[] =>
  (gallery ?? [])
    .filter((item) => Boolean(item.url && item.width && item.height))
    .map((item, index) => ({
      key: `gallery-${index}-${item.url}`,
      url: item.url,
      alt: text(item.alt, `Project image ${index + 1}`),
      caption: optionalText(item.caption),
      width: item.width as number,
      height: item.height as number,
    }));

export function normalizeProjectDetail(
  item: PROJECT_QUERYResult,
  fallbackSlug: string
): ProjectDetail | null {
  if (!item) return null;

  const title = text(item.title, "Untitled project");
  const slug = text(item.slug, fallbackSlug);
  if (!slug) return null;

  const coverUrl = text(item.coverImage?.url);

  return {
    _id: item._id,
    title,
    summary: text(item.summary),
    role: stringList(item.role),
    tags: stringList(item.tags),
    contributors: stringList(item.contributors),
    slug,
    year: item.year ?? null,
    projectType: optionalText(item.projectType),
    client: optionalText(item.client),
    location: optionalText(item.location),
    links: normalizeLinks(item.links ?? []),
    coverImage: coverUrl
      ? { url: coverUrl, alt: text(item.coverImage?.alt, `${title} cover image`) }
      : null,
    gallery: normalizeGallery(item.gallery),
    body: blocks(item.body),
    myContribution: blocks(item.myContribution),
  };
}
