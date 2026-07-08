const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const requiredPaths = ["/", "/robots.txt", "/sitemap.xml"];

async function assertOk(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
}

async function getFirstProjectPath() {
  const response = await fetch(new URL("/sitemap.xml", baseUrl));
  if (!response.ok) return null;
  const xml = await response.text();
  const match = xml.match(/https?:\/\/[^<]+(\/projects\/[^<]+)/);
  return match?.[1] || null;
}

for (const path of requiredPaths) {
  await assertOk(path);
}

const projectPath = await getFirstProjectPath();
if (projectPath) {
  await assertOk(projectPath);
}

console.log(`Smoke check passed for ${baseUrl}`);
