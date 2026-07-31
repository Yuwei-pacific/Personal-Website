import {writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {isDeepStrictEqual} from "node:util";

import {getCliClient} from "sanity/cli";

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ubdc9y57";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "personal_website";
const client = getCliClient({apiVersion, projectId, dataset}).withConfig({
  perspective: "raw",
  useCdn: false,
});
const shouldWrite = process.env.SANITY_I18N_WRITE === "1";
const snapshotPath = join(tmpdir(), "personal-website-i18n-source-snapshot.json");

const documentQuery = `*[_type in ["project", "education", "skillCategory"]]
  | order(_type asc, _id asc)`;

const hasOwn = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const hasContent = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};

const localizedValue = (type, legacyValue, existingValue) => {
  const source = hasContent(legacyValue)
    ? legacyValue
    : hasContent(existingValue?.en)
      ? existingValue.en
      : existingValue?.it;
  const it = hasContent(existingValue?.it) ? existingValue.it : source;
  const en = hasContent(existingValue?.en) ? existingValue.en : source;

  if (!hasContent(it) && !hasContent(en)) return undefined;

  return {
    _type: type,
    ...(hasContent(it) ? {it} : {}),
    ...(hasContent(en) ? {en} : {}),
  };
};

const replaceLocalizedField = (target, source, legacyName, localizedName, type) => {
  const value = localizedValue(type, source?.[legacyName], source?.[localizedName]);

  delete target[legacyName];
  if (value) target[localizedName] = value;
  else delete target[localizedName];
};

const migrateMedia = (media) => {
  if (!media || typeof media !== "object") return media;

  const next = {...media};
  replaceLocalizedField(next, media, "alt", "altTranslations", "localizedString");
  replaceLocalizedField(
    next,
    media,
    "caption",
    "captionTranslations",
    "localizedString",
  );
  return next;
};

const migrateSection = (section) => {
  if (!section || typeof section !== "object") return section;

  const next = {...section};

  if (section._type === "richTextSection") {
    replaceLocalizedField(
      next,
      section,
      "heading",
      "headingTranslations",
      "localizedString",
    );
    replaceLocalizedField(
      next,
      section,
      "content",
      "contentTranslations",
      "localizedProjectText",
    );
  }

  if (section._type === "quoteSection") {
    replaceLocalizedField(next, section, "quote", "quoteTranslations", "localizedText");
    replaceLocalizedField(
      next,
      section,
      "attribution",
      "attributionTranslations",
      "localizedString",
    );
  }

  if (section._type === "mediaTextSection") {
    replaceLocalizedField(
      next,
      section,
      "heading",
      "headingTranslations",
      "localizedString",
    );
    replaceLocalizedField(
      next,
      section,
      "content",
      "contentTranslations",
      "localizedProjectText",
    );
    if (section.media) next.media = migrateMedia(section.media);
  }

  if (section._type === "mediaSection" && section.media) {
    next.media = migrateMedia(section.media);
  }

  if (section._type === "mediaGroupSection") {
    replaceLocalizedField(
      next,
      section,
      "caption",
      "captionTranslations",
      "localizedString",
    );
    if (Array.isArray(section.items)) next.items = section.items.map(migrateMedia);
  }

  return next;
};

const migrateProject = (document) => {
  const set = {};
  const unset = [];
  const mappings = [
    ["title", "titleTranslations", "localizedString"],
    ["summary", "summaryTranslations", "localizedString"],
    ["projectType", "projectTypeTranslations", "localizedString"],
    ["role", "roleTranslations", "localizedStringList"],
    ["myContribution", "myContributionTranslations", "localizedProjectText"],
    ["location", "locationTranslations", "localizedString"],
  ];

  for (const [legacyName, localizedName, type] of mappings) {
    const value = localizedValue(type, document[legacyName], document[localizedName]);
    if (value && !isDeepStrictEqual(value, document[localizedName])) {
      set[localizedName] = value;
    }
    if (hasOwn(document, legacyName)) unset.push(legacyName);
  }

  if (document.coverImage) {
    const coverImage = {...document.coverImage};
    replaceLocalizedField(
      coverImage,
      document.coverImage,
      "alt",
      "altTranslations",
      "localizedString",
    );
    if (!isDeepStrictEqual(coverImage, document.coverImage)) set.coverImage = coverImage;
  }

  if (Array.isArray(document.links)) {
    const links = document.links.map((item) => {
      const next = {...item};
      replaceLocalizedField(next, item, "label", "labelTranslations", "localizedString");
      return next;
    });
    if (!isDeepStrictEqual(links, document.links)) set.links = links;
  }

  if (Array.isArray(document.gallery)) {
    const gallery = document.gallery.map(migrateMedia);
    if (!isDeepStrictEqual(gallery, document.gallery)) set.gallery = gallery;
  }

  if (Array.isArray(document.sections)) {
    const sections = document.sections.map(migrateSection);
    if (!isDeepStrictEqual(sections, document.sections)) set.sections = sections;
  }

  return {set, unset};
};

const migrateResume = (document) => {
  const set = {};
  const unset = [];
  const mappings = [
    ["degree", "degreeTranslations", "localizedString"],
    ["period", "periodTranslations", "localizedString"],
    ["location", "locationTranslations", "localizedString"],
    ["details", "detailsTranslations", "localizedProjectText"],
  ];

  for (const [legacyName, localizedName, type] of mappings) {
    const value = localizedValue(type, document[legacyName], document[localizedName]);
    if (value && !isDeepStrictEqual(value, document[localizedName])) {
      set[localizedName] = value;
    }
    if (hasOwn(document, legacyName)) unset.push(legacyName);
  }

  return {set, unset};
};

const migrateSkillCategory = (document) => {
  const value = localizedValue(
    "localizedString",
    document.title,
    document.titleTranslations,
  );

  return {
    set:
      value && !isDeepStrictEqual(value, document.titleTranslations)
        ? {titleTranslations: value}
        : {},
    unset: hasOwn(document, "title") ? ["title"] : [],
  };
};

const migrationFor = (document) => {
  if (document._type === "project") return migrateProject(document);
  if (document._type === "education") return migrateResume(document);
  return migrateSkillCategory(document);
};

const applyMigration = (document, migration) => {
  const next = {...document, ...migration.set};
  for (const field of migration.unset) delete next[field];
  return next;
};

const withoutRevisionMetadata = (document) => {
  const {_rev, _updatedAt, ...content} = document;
  void _rev;
  void _updatedAt;
  return content;
};

const documents = await client.fetch(documentQuery);
let snapshotCreated = false;
try {
  await writeFile(snapshotPath, `${JSON.stringify(documents, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  snapshotCreated = true;
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
}

const migrations = documents
  .map((document) => ({
    document,
    migration: migrationFor(document),
  }))
  .filter(
    ({migration}) =>
      Object.keys(migration.set).length > 0 || migration.unset.length > 0,
  );

const counts = documents.reduce((result, document) => {
  result[document._type] = (result[document._type] ?? 0) + 1;
  return result;
}, {});

console.log(
  `${shouldWrite ? "Migration" : "Dry run"}: ${documents.length} document versions ` +
    `(${counts.project ?? 0} projects, ${counts.education ?? 0} resume entries, ` +
    `${counts.skillCategory ?? 0} skill categories).`,
);
console.log(
  `Source snapshot: ${snapshotPath}${snapshotCreated ? "" : " (existing snapshot preserved)"}`,
);
console.log(`${migrations.length} document versions require changes.`);

for (const {document, migration} of migrations) {
  console.log(
    `- ${document._id}: set ${Object.keys(migration.set).join(", ") || "none"}; ` +
      `unset ${migration.unset.join(", ") || "none"}`,
  );
}

if (!shouldWrite) {
  console.log(
    "No writes performed. Run `npm run migrate:i18n-content:write` after reviewing this report.",
  );
  process.exit(0);
}

if (migrations.length === 0) {
  console.log("Nothing to migrate; the dataset is already on the localized object model.");
  process.exit(0);
}

let transaction = client.transaction();

for (const {document, migration} of migrations) {
  transaction = transaction.patch(document._id, (patch) => {
    let nextPatch = patch.ifRevisionId(document._rev);
    if (Object.keys(migration.set).length > 0) nextPatch = nextPatch.set(migration.set);
    if (migration.unset.length > 0) nextPatch = nextPatch.unset(migration.unset);
    return nextPatch;
  });
}

await transaction.commit({visibility: "sync"});

const migratedDocuments = await client.fetch(documentQuery);
const migratedById = new Map(migratedDocuments.map((document) => [document._id, document]));
const validationIssues = [];

for (const {document, migration} of migrations) {
  const actual = migratedById.get(document._id);
  const expected = applyMigration(document, migration);

  if (!actual) {
    validationIssues.push(`${document._id}: document missing after migration`);
    continue;
  }

  if (
    !isDeepStrictEqual(
      withoutRevisionMetadata(actual),
      withoutRevisionMetadata(expected),
    )
  ) {
    validationIssues.push(`${document._id}: migrated content does not match dry-run output`);
  }
}

if (validationIssues.length > 0) {
  console.error("Migration validation failed:");
  for (const issue of validationIssues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Migration complete and validated for ${migrations.length} document versions.`);
