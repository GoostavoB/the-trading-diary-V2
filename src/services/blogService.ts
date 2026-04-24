/**
 * blogService.ts
 *
 * Fetches blog articles from two sources and merges them:
 * 1. Supabase `blog_posts` table — CMS articles (managed via admin panel)
 * 2. Static TypeScript files — legacy articles (englishArticles.ts, etc.)
 *
 * CMS articles take precedence over static articles with the same slug.
 */

import { supabase } from '@/integrations/supabase/client';
import { BlogArticle, blogArticles as staticArticles } from '@/data/blogArticles';

export interface CmsPost {
  id: string;
  slug: string;
  language: string;
  status: 'draft' | 'published' | 'archived';
  title: string;
  description: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical: string | null;
  tags: string[] | null;
  hero_image: string | null;
  hero_image_alt: string | null;
  author: string;
  category: string;
  read_time: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Convert a Supabase CmsPost to the BlogArticle shape used by the UI */
function cmsPostToArticle(post: CmsPost): BlogArticle {
  return {
    slug: post.slug,
    language: post.language,
    title: post.title,
    description: post.description,
    content: post.content,
    metaTitle: post.meta_title ?? undefined,
    metaDescription: post.meta_description ?? undefined,
    focusKeyword: post.focus_keyword ?? undefined,
    canonical: post.canonical ?? `https://www.thetradingdiary.com/blog/${post.slug}`,
    tags: post.tags ?? undefined,
    heroImage: post.hero_image ?? undefined,
    heroImageAlt: post.hero_image_alt ?? undefined,
    author: post.author,
    category: post.category,
    readTime: post.read_time ?? '5 min read',
    date: post.published_at
      ? post.published_at.substring(0, 10)
      : post.created_at.substring(0, 10),
  };
}

/**
 * Fetch all published articles for a given language.
 * Merges CMS + static sources. CMS wins on slug conflicts.
 */
export async function fetchArticlesByLanguage(language: string): Promise<BlogArticle[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('language', language)
      .order('published_at', { ascending: false });

    if (error) throw error;

    const cmsArticles = (data as CmsPost[]).map(cmsPostToArticle);
    const cmsSlugs = new Set(cmsArticles.map(a => a.slug));

    // Keep static articles that don't have a CMS override
    const staticLang = staticArticles.filter(
      a => a.language === language && !cmsSlugs.has(a.slug)
    );

    // CMS articles first (most recent), then static
    return [...cmsArticles, ...staticLang];
  } catch {
    // If Supabase is unavailable, fall back to static articles
    return staticArticles.filter(a => a.language === language);
  }
}

/**
 * Fetch a single published article by slug (any language).
 * CMS takes precedence over static.
 */
export async function fetchArticleBySlug(slug: string): Promise<BlogArticle | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    if (data) return cmsPostToArticle(data as CmsPost);
  } catch {
    // fall through to static
  }

  return staticArticles.find(a => a.slug === slug) ?? null;
}

/**
 * Fetch all published articles across all languages (for sitemaps, RSS, etc.)
 */
export async function fetchAllPublishedArticles(): Promise<BlogArticle[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    const cmsArticles = (data as CmsPost[]).map(cmsPostToArticle);
    const cmsSlugs = new Set(cmsArticles.map(a => `${a.slug}-${a.language}`));

    const remainingStatic = staticArticles.filter(
      a => !cmsSlugs.has(`${a.slug}-${a.language}`)
    );

    return [...cmsArticles, ...remainingStatic];
  } catch {
    return staticArticles;
  }
}

// ============================================================
// Admin helpers (only callable by admin users)
// ============================================================

export async function createPost(post: Omit<CmsPost, 'id' | 'created_at' | 'updated_at'>): Promise<CmsPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data as CmsPost;
}

export async function updatePost(id: string, updates: Partial<CmsPost>): Promise<CmsPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CmsPost;
}

export async function publishPost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function unpublishPost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'draft' })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchAllPostsAdmin(): Promise<CmsPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CmsPost[];
}
