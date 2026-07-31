const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const requiredPaths = [
  "/it",
  "/en",
  "/it/about",
  "/en/about",
  "/robots.txt",
  "/sitemap.xml",
];

async function assertOk(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
}

async function assertRedirect(path, expectedPath) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  const location = response.headers.get("location");
  if (response.status !== 308 || !location || new URL(location, baseUrl).pathname !== expectedPath) {
    throw new Error(
      `${path} should redirect to ${expectedPath}; received ${response.status} ${location ?? ""}`,
    );
  }
}

async function assertHtmlLocale(path, locale) {
  const response = await fetch(new URL(path, baseUrl));
  const html = await response.text();
  if (!new RegExp(`<html[^>]+lang=["']${locale}["']`).test(html)) {
    throw new Error(`${path} did not render html lang=${locale}`);
  }
}

async function getProjectPaths() {
  const response = await fetch(new URL("/sitemap.xml", baseUrl));
  if (!response.ok) return [];

  const xml = await response.text();
  const projectPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, value]) => new URL(value).pathname)
    .filter((path) => /^\/(it|en)\/projects\//.test(path));

  return [...new Set(projectPaths)];
}

for (const path of requiredPaths) {
  await assertOk(path);
}

await assertRedirect("/", "/it");
await assertRedirect("/about", "/it/about");
await Promise.all([assertHtmlLocale("/it", "it"), assertHtmlLocale("/en", "en")]);

const projectPaths = await getProjectPaths();
await Promise.all(projectPaths.map(assertOk));

console.log(`Smoke check passed for ${baseUrl} (${projectPaths.length} project routes)`);
