-- Mag posts can target marketing service slugs for service-matched modules.
alter table public.blog_posts
  add column if not exists related_services text[] not null default '{}';

create index if not exists blog_posts_related_services_idx
  on public.blog_posts using gin (related_services);
