// Read-only HTTP smoke tests executed after the Cloudflare staging Worker deploy.
// Intentionally never POSTs, creates records, or requires credentials.
const base = (
  process.env.GOCAMP_STAGING_URL || "https://gocamp-migration-staging.elprincedoca.workers.dev"
).replace(/\/$/, "");
const tests = [
  { path: "/health", status: 200, contains: "gocamp" },
  { path: "/", status: 200, contains: "Go Camp" },
  { path: "/", status: 200, contains: "/media/49c7cbd7-a00e-5970-9ed1-1e14e077e016" },
  { path: "/about", status: 200, contains: "About Us" },
  { path: "/faq", status: 200 },
  { path: "/contact", status: 200 },
  { path: "/destinations/italy", status: 200, contains: "Italy" },
  { path: "/program/category?category=adult-academic", status: 200 },
  { path: "/program/category?category=kids-camps", status: 200, contains: "Kids Camps" },
  { path: "/admin/login", status: 200, contains: "Welcome back" },
  { path: "/admin", status: 302, location: "/admin/login" },
  { path: "/programs", status: 404 },
  { path: "/gallery", status: 404 },
  { path: "/media/00000000-0000-0000-0000-000000000000", status: 404 },
  { path: "/images/hero.webp", status: 200, method: "HEAD", source: "r2" },
  { path: "/images/bannnner.webp", status: 200, method: "HEAD", source: "r2" },
  {
    path: "/images/logo-transparent.webp",
    status: 200,
    method: "HEAD",
    source: "r2",
    contentType: "image/webp"
  },
  {
    path: "/uploads/1_1761381038.webp",
    status: 200,
    method: "HEAD",
    source: "r2",
    contentType: "image/webp"
  },
  {
    path: "/media/317d8670-b7ec-5f99-a007-bc93813e7e7d",
    status: 200,
    method: "HEAD",
    contentType: "image/webp"
  },
  {
    path: "/media/49c7cbd7-a00e-5970-9ed1-1e14e077e016",
    status: 200,
    method: "HEAD",
    contentType: "image/webp"
  },
  { path: "/home", status: 301, location: "/" },
  { path: "/index.php", status: 301, location: "/" },
  { path: "/home.php", status: 301, location: "/" },
  { path: "/about_us.php", status: 301, location: "/about" },
  { path: "/contact_us.php", status: 301, location: "/contact" },
  { path: "/faq.php", status: 301, location: "/faq" },
  { path: "/program/index", status: 404 },
  { path: "/program/index.php", status: 404 },
  { path: "/gallery.php", status: 404 },
  { path: "/not-a-legacy-page", status: 404 },
  { path: "/landing", status: 200, contains: "Transform Your Teen" },
  { path: "/landing.php", status: 301, location: "/landing" }
];
let failed = 0;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
for (const test of tests) {
  let result = null,
    error = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(base + test.path, {
        method: test.method || "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
        headers: { accept: "text/html,application/json,image/*" }
      });
      const text = test.method === "HEAD" ? "" : await res.text();
      const location = res.headers.get("location") || "";
      const passed =
        res.status === test.status &&
        (!test.contains || text.toLowerCase().includes(test.contains.toLowerCase())) &&
        (!test.location || location.includes(test.location)) &&
        (!test.contentType || (res.headers.get("content-type") || "").includes(test.contentType)) &&
        (!test.source || res.headers.get("x-gocamp-media-source") === test.source);
      result = {
        status: res.status,
        passed,
        location: location.slice(0, 120),
        snippet: text.slice(0, 160)
      };
      if (passed) break;
      error = "Unexpected response";
    } catch (e) {
      error = String(e);
    }
    if (attempt < 4) await sleep(1800);
  }
  if (result?.passed) console.log("PASS", test.path, result.status);
  else {
    console.error("FAIL", test.path, JSON.stringify({ expected: test.status, result, error }));
    failed++;
  }
}

// Verify real R2 variants are delivered, not silently replaced by originals.
try {
  const source = "/images/about_map.webp";
  const original = await fetch(base + source, { method: "HEAD" });
  const originalTag = original.headers.get("etag");
  if (original.status !== 200 || !originalTag) throw Error("Original not readable");
  for (const preset of ["mobile", "tablet", "desktop"]) {
    const response = await fetch(base + source + "?variant=" + preset, { method: "HEAD" });
    if (
      response.status !== 200 ||
      !response.headers.get("content-type")?.includes("image/webp") ||
      response.headers.get("etag") === originalTag
    ) {
      throw Error(preset + " image did not serve an optimized R2 object");
    }
    console.log("PASS responsive R2", preset);
  }
  const mediaId = "6d4a8098-3883-56d3-a9d4-0edd607016cf";
  const mediaOriginal = await fetch(base + "/media/" + mediaId);
  const mediaVariant = await fetch(base + "/media/" + mediaId + "?variant=mobile");
  if (
    mediaOriginal.status !== 200 || mediaVariant.status !== 200 ||
    !mediaVariant.headers.get("content-type")?.includes("image/webp") ||
    mediaVariant.headers.get("etag") === mediaOriginal.headers.get("etag")
  ) throw Error("/media ID did not resolve its R2 mobile variant");
  await Promise.all([mediaOriginal.arrayBuffer(), mediaVariant.arrayBuffer()]);
  console.log("PASS responsive D1 /media ID");
} catch (error) {
  failed++;
  console.error("FAIL responsive media delivery:", String(error));
}

if (failed) {
  console.error(failed + " staging smoke check(s) failed");
  process.exitCode = 1;
} else console.log("Staging HTTP smoke checks passed:", tests.length);
