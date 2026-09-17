-- Topic grouping within help collections (WeCasa-style nested sections)

alter table public.help_articles
  add column if not exists topic text not null default '';
