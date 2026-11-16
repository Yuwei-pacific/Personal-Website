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

// 不带语言前缀的地址按访客跳：先看 cookie 里手动选过的语言，再看浏览器语言，都没有就去英语
async function assertRedirect(path, expectedPath, headers = {}) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual", headers });
  const location = response.headers.get("location");
  if (response.status !== 307 || !location || new URL(location, baseUrl).pathname !== expectedPath) {
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

await assertRedirect("/", "/it", { "Accept-Language": "it-IT,it;q=0.9,en;q=0.8" });
await assertRedirect("/about", "/it/about", { "Accept-Language": "it" });
await assertRedirect("/", "/en", { "Accept-Language": "en-US,en;q=0.9" });
await assertRedirect("/about", "/en/about", { "Accept-Language": "zh-CN,zh;q=0.9" });
await assertRedirect("/", "/en", { "Accept-Language": "" });
await assertRedirect("/", "/it", { "Accept-Language": "en-US", Cookie: "locale=it" });
await assertRedirect("/", "/en", { "Accept-Language": "it", Cookie: "locale=en" });
await Promise.all([assertHtmlLocale("/it", "it"), assertHtmlLocale("/en", "en")]);

const projectPaths = await getProjectPaths();
await Promise.all(projectPaths.map(assertOk));

console.log(`Smoke check passed for ${baseUrl} (${projectPaths.length} project routes)`);
