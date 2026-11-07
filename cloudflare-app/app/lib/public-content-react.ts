import { useMemo } from "react";
import { useRouteLoaderData } from "react-router";
import {
  contentText,
  DEFAULT_PUBLIC_CONTENT,
  publicHome,
  publicSite,
  publicSlides,
  type PublicContent
} from "./public-content";

export function usePublicContent(group: string) {
  const root = useRouteLoaderData("root") as { publicContent?: PublicContent } | undefined;
  const content = root?.publicContent || DEFAULT_PUBLIC_CONTENT;
  const site = useMemo(() => publicSite(content), [content]);
  const home = useMemo(() => publicHome(content), [content]);
  const slides = useMemo(() => publicSlides(content), [content]);
  return {
    text: (key: string) => contentText(content, group, key),
    visible: (key: string) => content[group]?.[key] !== false,
    site,
    home,
    slides
  };
}
