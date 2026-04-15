# 01 — Information Architecture

## Site hierarchy

```
bestsurrey.co.uk/
├── (homepage)
├── [category]/                         → /restaurants/
│   └── (listing cards + subcategory links + town links)
├── [town]/                             → /guildford/
│   └── (town hub — links to all town+category combos)
├── [town]/[category]/                  → /guildford/restaurants/
│   └── (filtered listing index for that town+category)
├── surrey/[subcategory]/               → /surrey/vegan-restaurants/
│   └── (county-wide subcategory index)
├── listings/[slug]/                    → /listings/the-ivy-cobham/
│   └── (individual listing detail page)
└── guides/[slug]/                      → /guides/best-date-nights-surrey/
    └── (editorial roundup page)
```

---

## Page type inventory

| Page type | Route pattern | Primary SEO intent |
|-----------|---------------|-------------------|
| Homepage | `/` | Brand + broad discovery |
| Category index | `/[category]/` | Broad category ("best restaurants Surrey") |
| Town hub | `/[town]/` | Town intent ("things to do in Guildford") |
| Town + category | `/[town]/[category]/` | High-intent local ("restaurants in Guildford") |
| Subcategory | `/surrey/[subcategory]/` | Narrow intent ("vegan restaurants Surrey") |
| Listing | `/listings/[slug]/` | Branded + local search |
| Editorial roundup | `/guides/[slug]/` | Long-tail editorial ("best date nights Surrey") |

---

## Navigation structure

### Primary nav
- Eat (→ /restaurants/ + /cafes-brunch/)
- Do (→ /things-to-do/ + /activity-venues/)
- Family (→ /kids-activities/)
- Places (→ town hub index)
- Guides (→ /guides/)

### Secondary nav / utility
- About
- Submit a listing (Phase 7+)

### Footer
- Category links (all 5)
- Town links (all 8)
- Popular subcategories (top 8)
- Legal / About

---

## URL design principles

- All lowercase, hyphenated slugs
- No trailing parameters on indexable pages
- Taxonomy-led: category and town are path segments, not query strings
- Subcategory pages live under `/surrey/` to signal county-level scope
- Listing pages live under `/listings/` to keep a flat, stable namespace
- Editorial pages live under `/guides/`

### Canonical URL examples

```
/                                       Homepage
/restaurants/                           Category
/kids-activities/                       Category
/guildford/                             Town hub
/guildford/restaurants/                 Town + category
/guildford/kids-activities/             Town + category
/surrey/vegan-restaurants/              Subcategory
/surrey/go-karting/                     Subcategory
/listings/the-ivy-cobham/               Listing
/guides/best-date-nights-surrey/        Editorial roundup
```

---

## Routing strategy (Next.js App Router)

```
app/
├── page.tsx                            → /
├── [category]/
│   ├── page.tsx                        → /restaurants/
│   └── [town]/
│       └── page.tsx                    → /guildford/restaurants/  (WRONG — see note)
├── [town]/
│   ├── page.tsx                        → /guildford/
│   └── [category]/
│       └── page.tsx                    → /guildford/restaurants/
├── surrey/
│   └── [subcategory]/
│       └── page.tsx                    → /surrey/vegan-restaurants/
├── listings/
│   └── [slug]/
│       └── page.tsx                    → /listings/the-ivy-cobham/
└── guides/
    └── [slug]/
        └── page.tsx                    → /guides/best-date-nights-surrey/
```

**Note on town + category routing:** The URL pattern `/[town]/[category]/` (e.g. `/guildford/restaurants/`) is preferred over `/[category]/[town]/` because it puts the local anchor first, which matches user intent and keyword order in search. The Next.js catch order must be managed carefully to avoid slug collisions between town and category segments — handled by validating slugs against known taxonomy lists in `generateStaticParams`.

---

## Static generation strategy

All core indexable pages should be statically generated at build time (`generateStaticParams`) from the database. This ensures:
- Fast TTFB
- No server costs per request
- Full crawlability by Google

Revalidation: use ISR (Incremental Static Regeneration) with a 1-hour revalidation window once the site has live data. For v1 launch, full static builds are fine.

Dynamic routes (search, filter results): server-rendered or client-side — excluded from static sitemap.

---

## Sitemap and indexing

- Auto-generated XML sitemap from all published pages
- Sitemap split: core pages / listings / guides
- Canonical tags on all pages
- `noindex` on admin, search results, and filtered views (URL parameters)
- `robots.txt` to block `/admin/` and `/api/`
