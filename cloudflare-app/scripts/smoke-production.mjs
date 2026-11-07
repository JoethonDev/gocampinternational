// Read-only smoke tests for isolated production Worker builds.
// These target workers.dev; DNS/custom domain cutover is deliberately out of scope.
const base = (
  process.env.GOCAMP_PRODUCTION_URL ||
  "https://gocamp-migration-production.elprincedoca.workers.dev"
).replace(/\/$/, "");

const checks = [
  { path: "/", status: 200, contains: "Go Camp" },
  { path: "/health", status: 200, contains: "gocamp" },
  { path: "/about", status: 200, contains: "About Us" },
  { path: "/faq", status: 200 },
  { path: "/contact", status: 200 },
  { path: "/destinations/italy", status: 200, contains: "Italy" },
  { path: "/destinations/switzerland", status: 200, contains: "Switzerland" },
  { path: "/program/category?category=kids-camps", status: 200 },
  { path: "/admin/login", status: 200, contains: "Welcome back" },
  { path: "/admin", status: 302, location: "/admin/login" },
  { path: "/robots.txt", status: 200, contains: "Disallow: /" },
  { path: "/sitemap.xml", status: 404 },
  { path: "/media/49c7cbd7-a00e-5970-9ed1-1e14e077e016", status: 200, method: "HEAD", type: "image/webp" },
  { path: "/images/logo-transparent.webp", status: 200, method: "HEAD", type: "image/webp" },
  { path: "/uploads/1_1761381038.webp", status: 200, method: "HEAD", type: "image/webp" }
];

let failures = 0;
for (const test of checks) {
  let outcome = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(base + test.path, {
        method: test.method || "GET",
        redirect: "manual",
        headers: { Accept: "text/html,application/json,image/*" },
        signal: AbortSignal.timeout(15000)
      });
      const body = test.method === "HEAD" ? "" : await response.text();
      const correct =
        response.status === test.status &&
        (!test.contains || body.toLowerCase().includes(test.contains.toLowerCase())) &&
        (!test.location || (response.headers.get("location") || "").includes(test.location)) &&
        (!test.type || (response.headers.get("content-type") || "").includes(test.type)) &&
        (test.path === "/robots.txt" ||
          (response.headers.get("x-robots-tag") || "").includes("noindex"));
      if (correct) {
        outcome = "PASS";
        break;
      }
      outcome = `HTTP ${response.status}, type=${response.headers.get("content-type")}, robots=${response.headers.get("x-robots-tag")}`;
    } catch (error) {
      outcome = String(error);
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (outcome === "PASS") console.log("PASS", test.method || "GET", test.path);
  else {
    failures++;
    console.error("FAIL", test.method || "GET", test.path, outcome);
  }
}
if (failures) {
  console.error(`${failures} production smoke checks failed`);
  process.exitCode = 1;
} else console.log(`Production HTTP smoke checks passed: ${checks.length}`);
