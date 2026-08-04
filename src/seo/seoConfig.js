/**
 * Central SEO configuration.
 *
 * The site is a client-rendered SPA, so `index.html` only ships the metadata for
 * the homepage. This map supplies per-route title / description / canonical data
 * that `useSeo` applies to the document head on every navigation.
 *
 * Keep titles <= ~60 characters and descriptions ~150-160 characters so search
 * engines show them without truncating.
 */

export const SITE = {
  name: "Autonomiq",
  url: "https://autonomiq.ae",
  locale: "en_US",
  defaultImage: "https://autonomiq.ae/assets/logo.jpeg",
  twitterCard: "summary_large_image",
};

/** Routes that must never appear in search results (auth + utility flows). */
export const NOINDEX_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/company-details",
];

/** Per-route metadata. Keys must match the paths registered in App.jsx. */
export const ROUTE_SEO = {
  "/": {
    title: "Autonomiq — AI Voice, Web & WhatsApp Agents for Business",
    description:
      "AI agents that talk to your customers: a 3D web concierge, an outbound calling agent, and a WhatsApp assistant that qualify leads and book appointments 24/7.",
  },
  "/ai-assistants": {
    title: "AI Assistants — Voice, Web & WhatsApp Agents | Autonomiq",
    description:
      "Meet the Autonomiq AI assistants. See how our web, calling, and WhatsApp agents handle enquiries, qualify leads, and book appointments for your business.",
  },
  "/solutions": {
    title: "AI Solutions & Services | Autonomiq",
    description:
      "Automation, integration, and custom AI development from Autonomiq — CRM workflows, analytics, and bespoke agents built around how your team already works.",
  },
  "/about": {
    title: "About Autonomiq — Our Vision for AI Agents",
    description:
      "Learn who we are and why we build AI agents. Autonomiq helps businesses replace waiting queues and missed calls with assistants that respond instantly.",
  },
  "/book-appointment": {
    title: "Book a Demo Appointment | Autonomiq",
    description:
      "Book a free appointment with the Autonomiq team. See a live demo of our AI voice, web, and WhatsApp agents and how they fit your business.",
  },
  "/blog": {
    title: "Blog — AI Agent Insights | Autonomiq",
    description:
      "Articles and updates from the Autonomiq team on conversational AI, voice agents, automation, and how businesses are putting AI agents to work.",
  },
  "/careers": {
    title: "Careers at Autonomiq — Join the Team",
    description:
      "Open roles at Autonomiq. Help build AI voice, web, and WhatsApp agents used by businesses to talk with their customers every day.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Autonomiq",
    description:
      "How Autonomiq collects, uses, stores, and protects your personal information, and the rights you have over your data.",
  },
  "/cookie-policy": {
    title: "Cookie Policy | Autonomiq",
    description:
      "Which cookies and similar technologies Autonomiq uses, what they do, and how you can manage or disable them.",
  },
  "/terms-of-service": {
    title: "Terms of Service | Autonomiq",
    description:
      "The terms and conditions that govern your use of the Autonomiq website and AI agent services.",
  },

  /* Auth + utility routes — titled for usability, excluded from indexing. */
  "/login": {
    title: "Log In | Autonomiq",
    description: "Log in to your Autonomiq account.",
  },
  "/signup": {
    title: "Create an Account | Autonomiq",
    description: "Create an Autonomiq account to talk to our AI agents.",
  },
  "/forgot-password": {
    title: "Forgot Password | Autonomiq",
    description: "Reset the password for your Autonomiq account.",
  },
  "/reset-password": {
    title: "Reset Password | Autonomiq",
    description: "Choose a new password for your Autonomiq account.",
  },
  "/verify-email": {
    title: "Verify Your Email | Autonomiq",
    description: "Confirm your email address to finish setting up your account.",
  },
};

/** Fallback used for any route without an explicit entry (e.g. unknown paths). */
export const FALLBACK_SEO = {
  title: "Autonomiq — AI Voice, Web & WhatsApp Agents for Business",
  description:
    "AI agents that talk to your customers: a 3D web concierge, an outbound calling agent, and a WhatsApp assistant that qualify leads and book appointments 24/7.",
};

/**
 * Resolve the SEO record for a pathname.
 * Trailing slashes are normalised so `/about` and `/about/` behave the same.
 */
export function getSeoForPath(pathname) {
  const path =
    pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : "/";
  const entry = ROUTE_SEO[path] || FALLBACK_SEO;

  return {
    ...entry,
    path,
    canonical: `${SITE.url}${path === "/" ? "/" : path}`,
    image: entry.image || SITE.defaultImage,
    noindex: NOINDEX_ROUTES.includes(path) || !ROUTE_SEO[path],
  };
}
