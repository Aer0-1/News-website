/**
 * sanitize.ts — Shared utility for HTML sanitization, read time calculation,
 * image URL helpers, and TypeScript interfaces.
 *
 * Created as part of the News App fix package to:
 *   - Prevent XSS from dangerouslySetInnerHTML
 *   - Calculate read time dynamically instead of hardcoding "5 min"
 *   - Provide consistent image URL fallbacks
 *   - Centralize Article type definitions
 */

import DOMPurify from "isomorphic-dompurify";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  sources: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
}

export interface ArticleDetail {
  id: string;
  title: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  content: string | null;
  url: string | null;
  author: string | null;
  sentiment_score: number | null;
  sources: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
  [key: string]: unknown;
}

/**
 * Helper to extract the `.name` from a Supabase join field that
 * may come back as either an object or a single-element array.
 */
export function getName(field: { name: string } | { name: string }[] | null | undefined): string | undefined {
  if (!field) return undefined;
  if (Array.isArray(field)) return field[0]?.name;
  return field.name;
}

// ─── HTML Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe tags for article rendering while stripping scripts, event handlers, etc.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
      "span", "div", "hr",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class",
      "target", "rel", "width", "height",
    ],
  });
}

// ─── Read Time Calculation ──────────────────────────────────────────────────

/**
 * Calculate estimated read time based on word count.
 * Average reading speed: ~200 words per minute.
 */
export function calculateReadTime(content: string | null | undefined): string {
  if (!content) return "1 min read";
  // Strip HTML tags for accurate word count
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ─── Image URL Helper ───────────────────────────────────────────────────────

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800";

/**
 * Return a valid image URL or a deterministic fallback.
 * Avoids Math.random() in URLs which causes hydration mismatches.
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  fallback?: string
): string {
  if (imageUrl && imageUrl.startsWith("http")) return imageUrl;
  return fallback || DEFAULT_IMAGE;
}
