const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const requiredPaths = ["/", "/robots.txt", "/sitemap.xml"];

async function assertOk(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
}

async function getProjectPaths() {
  const response = await fetch(new URL("/sitemap.xml", baseUrl));
  if (!response.ok) return [];

  const xml = await response.text();
  const projectPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, value]) => new URL(value).pathname)
    .filter((path) => path.startsWith("/projects/"));

  return [...new Set(projectPaths)];
}

for (const path of requiredPaths) {
  await assertOk(path);
}

const projectPaths = await getProjectPaths();
await Promise.all(projectPaths.map(assertOk));

console.log(`Smoke check passed for ${baseUrl} (${projectPaths.length} project routes)`);
