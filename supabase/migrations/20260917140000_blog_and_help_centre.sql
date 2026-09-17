-- Editorial content: Mundoria Mag (blog) + Help Centre

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (char_length(trim(slug)) > 0),
  excerpt text,
  content text not null,
  category text not null default 'Company News',
  cover_url text,
  author_name text not null default 'Mundoria Team',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);

create table if not exists public.help_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  audience text not null default 'customers'
    check (audience in ('customers', 'cleaners', 'both')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.help_collections (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text not null default '',
  body text not null,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_articles_collection_idx
  on public.help_articles (collection_id, sort_order);

alter table public.blog_posts enable row level security;
alter table public.help_collections enable row level security;
alter table public.help_articles enable row level security;

create policy "Public can read published blog posts"
on public.blog_posts for select
using (published = true);

create policy "Public can read help collections"
on public.help_collections for select
using (true);

create policy "Public can read published help articles"
on public.help_articles for select
using (published = true);

grant select on public.blog_posts to anon, authenticated;
grant select on public.help_collections to anon, authenticated;
grant select on public.help_articles to anon, authenticated;
