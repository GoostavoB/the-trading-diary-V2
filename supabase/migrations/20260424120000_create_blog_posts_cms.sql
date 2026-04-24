-- ============================================================
-- Blog Posts CMS
-- Allows publishing articles without code deploys.
-- Authors with is_admin = true can create/edit/delete posts.
-- Public can read published posts (status = 'published').
-- ============================================================

create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  language     text not null default 'en',  -- en, pt, es, ar, vi
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),

  -- Content
  title        text not null,
  description  text not null,
  content      text not null,  -- Markdown

  -- SEO
  meta_title        text,
  meta_description  text,
  focus_keyword     text,
  canonical         text,
  tags              text[],

  -- Media
  hero_image     text,  -- public URL
  hero_image_alt text,

  -- Meta
  author        text not null default 'Gustavo',
  category      text not null default 'Trading',
  read_time     text,

  -- Timestamps
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_blog_post_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.handle_blog_post_updated_at();

-- Index for fast lookups
create index if not exists blog_posts_slug_lang_idx   on public.blog_posts (slug, language);
create index if not exists blog_posts_status_lang_idx on public.blog_posts (status, language);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.blog_posts enable row level security;

-- Anyone can read published posts
create policy "Public can read published posts"
  on public.blog_posts for select
  using (status = 'published');

-- Admin users can do everything
-- (add user_id to auth.users metadata: { "is_admin": true } to grant access)
create policy "Admins can manage all posts"
  on public.blog_posts for all
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
