# 06 — Internal Linking Rules

## Why this matters

Internal links are how Google understands the relationship between pages and how PageRank flows through the site. The goal is to:
- Signal the hierarchy: homepage → categories → town+category → listings
- Push link equity toward high-priority SEO pages (town+category combos)
- Create natural discovery paths for users

---

## Link flow diagram

```
Homepage
├── → All 5 category pages
├── → All 8 town pages
├── → Featured listing pages (direct)
└── → Guide pages

Category pages (/[category]/)
├── → All subcategory pages for this category
├── → All /[town]/[category]/ pages (8 per category = 40 total)
└── → Individual listing pages (via cards)

Town pages (/[town]/)
├── → All /[town]/[category]/ pages (5 per town = 40 total)
└── → Top listing pages in this town

Town + category pages (/[town]/[category]/)
├── → Listing pages (via cards)
├── → Parent category page
├── → Parent town page
├── → Same category in 2–3 nearby towns
└── → Relevant subcategory pages

Subcategory pages (/surrey/[subcategory]/)
├── → Listing pages (via cards)
├── → Parent category page
└── → Town + category pages (where subcategory has listings)

Listing pages (/listings/[slug]/)
├── → Parent town + category page (breadcrumb)
├── → Parent category page (breadcrumb)
├── → 3 related listings (same town + category)
└── → Roundup pages that feature this listing (if any)

Guide pages (/guides/[slug]/)
├── → Each featured listing page
├── → Parent category page
└── → 2–3 related guide pages
```

---

## Linking rules by page type

### Homepage rules
1. Must link to all 5 category pages — always visible, not hidden
2. Must link to all 8 town pages — always visible
3. Featured listing links must change as featured listings rotate
4. Never link to unpublished or draft pages

### Category page rules
1. Must include a "Browse by town" section linking to all `/[town]/[category]/` pages where at least 1 published listing exists
2. Must include subcategory links to all subcategories with at least 1 listing
3. Listing cards link directly to listing pages — do not link through town+category as an intermediary
4. Include a "See also" section with 2–3 related categories (e.g. Restaurants → Cafés & Brunch)

### Town + category page rules
1. Must link to parent category and parent town in breadcrumbs
2. Must include 2–3 "Nearby towns" links (same category, different town)
3. Must include subcategory filter links where listings exist
4. These pages are the most important SEO targets — prioritise them in linking from as many places as possible

### Listing page rules
1. Breadcrumb must render full path and link each level
2. Related listings section must show 3 listings from the same town + category, ordered by `ranking_score DESC`
3. If listing belongs to a roundup, link to that roundup ("Featured in: Best Date Night Restaurants in Surrey")
4. Do not link to competing listings with `sponsored = true` from organic listing pages

### Roundup rules
1. Every listing mentioned must link to its listing page
2. Must include a CTA to the relevant category page
3. Include 2–3 related guides at the bottom
4. Related guides must be manually curated (not auto-generated) to avoid irrelevant links

---

## Anchor text rules

Avoid generic anchors ("click here", "read more"). Use descriptive, keyword-relevant text.

| Link destination | Preferred anchor pattern |
|-----------------|--------------------------|
| Category page | "best restaurants in Surrey" |
| Town + category | "restaurants in Guildford" |
| Subcategory | "vegan restaurants in Surrey" |
| Listing | Listing name (e.g. "The Ivy Cobham Brasserie") |
| Town hub | "things to do in Guildford" or "Guildford guide" |
| Guide | Guide title |

---

## Minimum link requirements per page

| Page type | Min internal links out |
|-----------|------------------------|
| Homepage | 13+ (5 categories + 8 towns) |
| Category | 8+ (towns) + subcategories |
| Town hub | 5+ (all categories for this town) |
| Town + category | 5+ (breadcrumb + nearby towns + listings) |
| Subcategory | 3+ (parent category + listings) |
| Listing | 4+ (breadcrumb levels + 3 related listings) |
| Guide | 4+ (listing pages + category page) |

---

## Avoiding link dilution

- Don't add excessive footer links beyond category and town navigation
- Sidebar "Related" sections should show max 3–5 items
- Pagination links should use `rel="next"` / `rel="prev"` correctly
- Don't create link loops (e.g. listing → town+category → listing → town+category...)

---

## Programmatic link generation

For town + category cross-links (40 combinations in v1), links are generated programmatically from the taxonomy data. A utility function generates all valid combinations:

```typescript
// Only generate a link if at least 1 published listing exists for that combo
function getTownCategoryLinks(categorySlug: string, excludeTown?: string) {
  return towns
    .filter(t => t.slug !== excludeTown)
    .filter(t => listingCountByTownCategory[t.slug]?.[categorySlug] > 0)
    .map(t => ({
      href: `/${t.slug}/${categorySlug}/`,
      label: `${category.name} in ${t.name}`
    }))
}
```

This prevents ghost pages (pages that exist but have no listings) from receiving link equity.

---

## Sitemap cross-check

Internal linking coverage should match sitemap coverage. Any page in the sitemap should be reachable via at least one internal link from another published page. Orphaned pages should be flagged as an admin warning.
