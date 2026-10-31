import type { Route } from "./+types/about";
import { AboutPage } from "../features/about/AboutPage";
import { originFrom, seoMeta } from "../lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: "/about",
    title: "Go Camp :: About Us",
    description:
      "With 15 years of experience, Go Camp International combines excellent language education with a wide range of leisure, sport, and sightseeing activities."
  });
}

export default function About() {
  return <AboutPage />;
}
