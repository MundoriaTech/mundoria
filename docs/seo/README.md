# SEO, AI search and copy rules

These rules keep the fixes from the November 2026 audit in place. Read this before you change marketing pages, URLs, prices, reviews or company details.

## Prices: one source

- The admin rate card (`platform_settings.service_pricing`, edited in Admin settings) is the only price source. The booking flow charges from it.
- Never type a price into copy, titles, FAQs or `llms.txt`.
  - In service titles and descriptions, use the `{from}` token in `lib/seo/onpage-copy.ts`.
  - Elsewhere, call `fromRateLabel` or `houseCleaningFromLabel` (`lib/customer/published-pricing.ts`) with `loadServicePricing()`.
  - FAQ catalogue answers that state a price go through `applyPricingFaqOverrides`.
- Marketing pages revalidate every 5 minutes, so a rate-card change reaches every page and `llms.txt` within that window.

## Reviews and cleaners: real only

- Only reviews written after a completed, applied booking may appear: the `marketing_reviews` view, via `publishedReviews()`.
- Never add placeholder, curated or "example" testimonials, ratings or cleaners. Faking reviews or presenting them misleadingly breaks the DMCC Act 2024 and Google's policies.
- The only star rating on the site is the live Google rating (`GoogleReviewsButton`).
  - It only accepts a Google listing whose name contains "Mundoria".
  - Set `GOOGLE_PLACE_ID` to the verified listing.
- Seed and demo accounts (`*@seed.mundoria.local`) are excluded from the public views by migration `20261109120000_hide_seed_accounts_from_marketing.sql`.

## Company details

- These are set through environment variables:
  - `NEXT_PUBLIC_COMPANY_LEGAL_NAME`
  - `NEXT_PUBLIC_COMPANY_NUMBER`
  - `NEXT_PUBLIC_REGISTERED_OFFICE_STREET`, `_LOCALITY` and `_POSTCODE`
- They feed the footer, terms, About page and Organization schema (`lib/seo/identity.ts`).
- An empty value is left out. Never put placeholder text in these variables.

## URLs and redirects

- Every retired URL must reach a live page in **one** redirect:
  - Retired service slugs: add them to `SEO_SERVICE_REDIRECTS` (`lib/seo/canonical.ts`) and to `RETIRED_SERVICE_SLUGS` (`next.config.mjs`).
  - Retired area slugs: add them to `SEO_AREA_REDIRECTS`, pointing at a page that returns 200. Hubs whose label matches a place use the place slug, for example `erdington`.
- Postcode-district URLs (`harborne-b17`) redirect to their neighbourhood page; they are not separate pages.
- Mag and Help article links to retired URLs are rewritten on render (`canonicalInternalHref`). Still update the source text when you can.
- New public pages need an internal link (nav, footer, a hub or a sibling list), not just a sitemap entry.

## Titles, descriptions and dates

- Titles: about 60 characters at most. `brandedTitle` drops the "| Mundoria" suffix when it would overflow.
- Descriptions: about 110 to 160 characters. Use `fullDescription()` to pad short ones.
- Do not use "Best", "top-rated" or other superlatives until verified reviews support them.
- Sitemap `lastmod`:
  - Marketing pages use `MARKETING_CONTENT_UPDATED_AT` (`lib/seo/site.ts`). Bump it when their templates or copy change.
  - Mag and Help pages use each row's own `updated_at`.

## Analytics and cookies

- Google Tag Manager loads only after the visitor accepts analytics or marketing cookies (`components/analytics/analytics-provider.tsx`).
- Do not put the GTM snippet back in the document head.
- Check that every tag inside the container also respects Consent Mode.

## Naming (copy style)

| Use | Not |
| --- | --- |
| Mundoria (brand); Mundoria UK (legal name only) | Mundoria Birmingham |
| house cleaning | home cleaning, residential (in customer copy) |
| short-let | shortlet, Shortlet |
| workspace cleaning (category); office cleaning (service) | workplace |
| cleaners, or cleaning professionals | pros |
| recovery cleaning (lower case mid-sentence) | Recovery cleaning |

- British spelling throughout.
- Aim for sentences of 15 to 20 words.
- "Vetted", "DBS" and "insured" must match what onboarding actually checks:
  - DBS and right to work apply only "where applicable".
  - Insurance is an onboarding requirement, not a Mundoria policy covering the customer.

## AI search (GEO and AEO)

- `/llms.txt` and `/llms-full.txt` are generated from the same data as the pages (`lib/seo/llms.ts`). Do not hand-edit facts there.
- `robots.ts` allows the main AI crawlers on public pages only.
- Keep answers direct: a question heading, then a one-paragraph answer that holds up when quoted on its own.
