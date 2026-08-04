import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE, getSeoForPath } from "../seo/seoConfig";

/**
 * Upsert a <meta> tag in the document head.
 * `attr` is "name" for standard meta tags and "property" for Open Graph tags.
 */
function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Upsert <link rel="canonical">. */
function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Keeps the document head in sync with the active route.
 *
 * Because this is a client-rendered SPA, crawlers only see whatever the head
 * contains after React runs. Updating it on every navigation gives each route a
 * unique title, description, canonical URL, and social preview, and marks auth
 * pages as noindex so they stay out of search results.
 */
export function useSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getSeoForPath(pathname);

    document.title = seo.title;

    setMeta("name", "description", seo.description);
    setMeta(
      "name",
      "robots",
      seo.noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    setCanonical(seo.canonical);

    // Open Graph
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:locale", SITE.locale);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", seo.canonical);
    setMeta("property", "og:image", seo.image);

    // Twitter / X
    setMeta("name", "twitter:card", SITE.twitterCard);
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    setMeta("name", "twitter:image", seo.image);
  }, [pathname]);
}

export default useSeo;
