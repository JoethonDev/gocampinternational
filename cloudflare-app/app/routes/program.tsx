import { Link, redirect, useRouteLoaderData } from "react-router";
import { getCloudflare } from "../lib/cloudflare-context";
import { findCatalog, findCategory } from "../lib/catalog.server";
import { SafeRichText } from "../components/SafeRichText";
import { asStringArray, type CategoryRecord, type ProgramRecord } from "../lib/domain";
import {
  cleanSeoText,
  originFrom,
  resolveCatalogSeo,
  robotsFromMatches,
  safeJsonLd,
  seoMeta
} from "../lib/seo";
import type { Route } from "./+types/program";

type PublicDestination = { slug: string; name: string };

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const slug = params.slug || "";
  const program = await findCatalog<ProgramRecord>(db, "program", slug);

  // Preserve valid legacy category URLs with a single permanent redirect.
  if (!program) {
    const category = await findCategory(db, slug);
    if (category?.status === "active") {
      throw redirect("/program/category?category=" + encodeURIComponent(slug), 301);
    }
  }

  if (
    !program ||
    program.status !== "active" ||
    !cleanSeoText(program.name) ||
    !cleanSeoText(program.description || program.tagline)
  ) {
    throw new Response("Not Found", { status: 404 });
  }

  const [maybeCategory, destination] = await Promise.all([
    program.category_slug ? findCategory(db, program.category_slug) : Promise.resolve(null),
    db
      .prepare(
        "SELECT d.slug,d.name FROM destination_programs dp JOIN catalog_entities d ON d.kind='destination' AND d.slug=dp.destination_slug AND d.status='active' WHERE dp.program_slug=? ORDER BY d.sort_order,d.slug LIMIT 1"
      )
      .bind(program.slug)
      .first<PublicDestination>()
  ]);
  const category: CategoryRecord | null =
    maybeCategory?.status === "active" ? maybeCategory : null;
  return { program, category, destination };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const program = loaderData?.program;
  const destination = loaderData?.destination;
  const title = program?.name
    ? program.name + (destination?.name ? " in " + destination.name : "")
    : "Program";
  const seo = resolveCatalogSeo(
    "program",
    title,
    program?.tagline || program?.description,
    program?.image,
    program?.seo
  );
  return seoMeta({
    origin: originFrom(matches),
    path: "/programs/" + encodeURIComponent(program?.slug || ""),
    ...seo,
    robots: robotsFromMatches(matches, seo.noindex || program?.status !== "active")
  });
}

export default function Program({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as { origin?: string } | undefined;
  const base = root?.origin || "https://gocampinternational.net";
  const { program, category, destination } = loaderData;
  const description = typeof program.description === "string" ? program.description : "";
  const title = program.name + (destination?.name ? " in " + destination.name : "");
  const seo = resolveCatalogSeo(
    "program",
    title,
    program.tagline || description,
    program.image,
    program.seo
  );
  const url = new URL("/programs/" + encodeURIComponent(program.slug), base).href;
  const breadcrumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
    ...(category
      ? [
          {
            "@type": "ListItem",
            position: 2,
            name: category.name,
            item: base + "/program/category?category=" + encodeURIComponent(category.slug)
          }
        ]
      : []),
    { "@type": "ListItem", position: category ? 3 : 2, name: program.name, item: url }
  ];
  const highlights = asStringArray(program.highlights);

  return (
    <div className="page-content">
      {seo.structuredDataEnabled && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebPage",
                  name: title,
                  url,
                  description: cleanSeoText(program.tagline || description),
                  isPartOf: { "@id": base + "/#website" }
                },
                { "@type": "BreadcrumbList", itemListElement: breadcrumbs }
              ]
            })
          }}
        />
      )}
      <section className="container py-5">
        <nav aria-label="Breadcrumb" className="small mb-4">
          <Link to="/">Home</Link>
          {category && (
            <>
              {" / "}
              <Link to={"/program/category?category=" + encodeURIComponent(category.slug)}>
                {category.name}
              </Link>
            </>
          )}
          {" / "}
          <span aria-current="page">{program.name}</span>
        </nav>
        <div className="row g-4 align-items-start">
          <div className={program.image ? "col-lg-7" : "col-12"}>
            <h1 className="fw-bold mb-3">{program.name}</h1>
            {destination && (
              <p className="text-secondary mb-3">
                Destination:{" "}
                <Link to={"/destinations/" + encodeURIComponent(destination.slug)}>
                  {destination.name}
                </Link>
              </p>
            )}
            {program.tagline && <p className="lead">{program.tagline}</p>}
            {description && (
              <div className="program-description">
                <SafeRichText html={description} />
              </div>
            )}
            {highlights.length > 0 && (
              <section className="mt-4" aria-label="Program highlights">
                <h2 className="h4">Program highlights</h2>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            <p className="small text-secondary mt-4">
              For current dates, availability and details, please contact Go Camp International.
            </p>
            <Link className="btn btn-primary" to="/contact">
              Ask about this experience
            </Link>
          </div>
          {program.image && (
            <div className="col-lg-5">
              <img
                src={program.image}
                alt={program.name}
                className="img-fluid rounded-4 shadow-sm"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
