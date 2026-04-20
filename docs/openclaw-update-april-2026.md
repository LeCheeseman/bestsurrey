# BestSurrey — OpenClaw Update Brief
*Supersedes earlier instructions where they conflict. All new CSVs must follow this document.*

---

## What Has Changed

### 1. Category renames — update your CSVs immediately

| Old (do not use) | New (use this) | Display name |
|---|---|---|
| `activity-venues` | `indoor-activities` | Indoor Activities |
| `kids-activities` | `kids-family` | Kids & Family |

Any CSV still using the old slugs will fail on import. Check all pending files.

### 2. New category: Pubs & Bars

Pubs and bars are now their own top-level category, separate from restaurants.

| Field | Value |
|---|---|
| `category_slug` | `pubs-bars` |
| Display name | Pubs & Bars |
| `entity_type` | `restaurant` |

This covers: traditional pubs, gastropubs, country pubs, wine bars, cocktail bars, beer gardens.

**Do not put pubs in the `restaurants` category.** Restaurants with pub-style food (e.g. a gastropub that also does a sit-down dinner menu) should go in `pubs-bars`. Only use `restaurants` for venues where dining is clearly the primary purpose.

### 3. Expanded town list

11 new towns have been added. You may now create CSVs for all of these:

**Tier 2 (do soon):**
- `godalming` — Godalming
- `leatherhead` — Leatherhead
- `esher` — Esher
- `walton-on-thames` — Walton-on-Thames
- `camberley` — Camberley
- `redhill` — Redhill

**Tier 3 (do later):**
- `haslemere` — Haslemere
- `oxted` — Oxted
- `virginia-water` — Virginia Water
- `cranleigh` — Cranleigh
- `staines` — Staines-upon-Thames

---

## Full Valid Values Reference

### `category_slug` — complete list
```
restaurants
pubs-bars
cafes-brunch
things-to-do
kids-family
indoor-activities
```

### `town_slug` — complete list
```
guildford · woking · epsom · camberley · redhill · farnham
reigate · godalming · leatherhead · cobham · weybridge · esher · walton-on-thames
dorking · haslemere · oxted · virginia-water · cranleigh · staines
```

### `entity_type` — by category
```
restaurants       → restaurant
pubs-bars         → restaurant
cafes-brunch      → cafe
things-to-do      → attraction
kids-family       → attraction  (or activity-venue for soft play / indoor)
indoor-activities → activity-venue
```

### Subcategory slugs — by category

**`restaurants`**
```
fine-dining · casual-dining · date-night · family-dining · sunday-roast
vegan-restaurants · vegetarian-restaurants · takeaway · brunch
```

**`pubs-bars`** ← new
```
gastropubs · traditional-pubs · country-pubs · beer-gardens
wine-bars · cocktail-bars · sports-bars · pubs-gastropubs
```

**`cafes-brunch`**
```
coffee-shops · brunch-spots · bakeries · tea-rooms
```

**`things-to-do`**
```
walks-nature · historic-sites · gardens-parks · days-out
arts-culture · entertainment · cycling
```

**`kids-family`** ← renamed from kids-activities
```
soft-play · farms-animals · outdoor-play · museums-education
arts-crafts · theme-parks · holiday-activities
indoor-kids-activities · outdoor-kids-activities
```

**`indoor-activities`** ← renamed from activity-venues
```
escape-rooms · bowling · go-karting · climbing · mini-golf
laser-tag · trampoline-parks · axe-throwing · virtual-reality · swimming
```

---

## Revised Batch Order

Work through these in order. Batches already completed are marked.

### Priority 1 — Do now
| # | Town | Category | Slug to use | Status |
|---|---|---|---|---|
| 1 | Guildford | Restaurants | `restaurants` | ✅ Done |
| 2 | Guildford | Cafés & Brunch | `cafes-brunch` | ✅ Done |
| 3 | Guildford | **Pubs & Bars** | `pubs-bars` | ⬜ Next |
| 4 | Guildford | Things To Do | `things-to-do` | ⬜ |
| 5 | Guildford | Kids & Family | `kids-family` | ⬜ |
| 6 | Guildford | Indoor Activities | `indoor-activities` | ⬜ |
| 7 | Woking | Restaurants | `restaurants` | ⬜ |
| 8 | Woking | Pubs & Bars | `pubs-bars` | ⬜ |
| 9 | Woking | Cafés & Brunch | `cafes-brunch` | ⬜ |
| 10 | Epsom | Restaurants | `restaurants` | ⬜ |
| 11 | Epsom | Pubs & Bars | `pubs-bars` | ⬜ |
| 12 | Farnham | Restaurants | `restaurants` | ⬜ |
| 13 | Farnham | Pubs & Bars | `pubs-bars` | ⬜ |
| 14 | Farnham | Cafés & Brunch | `cafes-brunch` | ⬜ |
| 15 | Camberley | Restaurants | `restaurants` | ⬜ |
| 16 | Redhill | Restaurants | `restaurants` | ⬜ |

### Priority 2 — Do soon
Reigate, Godalming, Leatherhead, Cobham, Weybridge, Esher, Walton-on-Thames — all 6 categories each.

### Priority 3 — Do later
Dorking, Haslemere, Oxted, Virginia Water, Cranleigh, Staines — restaurants and pubs-bars first, others if enough venues exist.

---

## Pubs & Bars — Research Notes

This is a new category. When scraping for pubs:

- **Country pubs** are especially valuable for Surrey — look for pubs with beer gardens, dog-friendly, near walking routes
- **Gastropubs** (serve quality food as well as drinks) are high priority
- Use Google Maps type filter: "bar" and "pub" — exclude venues that are primarily nightclubs
- Good sources: CAMRA Good Beer Guide, VisitSurrey, local blog roundups for "[town] best pubs"
- For `entity_type`: always use `restaurant` (pubs don't have their own entity type)
- For `price_band`: use the food price band if they serve food, otherwise leave blank

**Subcategory guidance for pubs:**
- Traditional village/town pub with no food emphasis → `traditional-pubs`
- Pub known for food quality → `gastropubs`
- Rural pub outside town, near walks → `country-pubs`
- Has a large outdoor area → `beer-gardens` (can combine with others)
- Wine/cocktail focus, more bar than pub → `wine-bars` or `cocktail-bars`

---

## Target Listings Per Batch

| Category | Tier 1 towns | Tier 2 towns | Tier 3 towns |
|---|---|---|---|
| Restaurants | 10–15 | 6–10 | 4–6 |
| Pubs & Bars | 8–12 | 5–8 | 3–5 |
| Cafés & Brunch | 8–10 | 4–6 | 3–4 |
| Things To Do | 8–12 | 5–8 | 3–5 |
| Kids & Family | 6–10 | 4–6 | 2–4 |
| Indoor Activities | 4–8 | 2–4 | skip if <3 venues |

Quality over quantity. Do not pad with weak entries.

---

## CSV Column Spec (unchanged)

```
name,slug,town_slug,category_slug,entity_type,status,address_line1,address_line2,postcode,latitude,longitude,website_url,phone_number,images,short_summary,long_description,why_we_like_it,highlights,best_for,family_friendly,dog_friendly,vegan_friendly,vegetarian_friendly,wheelchair_accessible,indoor,outdoor,good_for_groups,booking_required,price_band,parking,featured,sponsored,editorial_score,category_fit_score,review_score,review_count,subcategory_slugs,opening_hours,faq
```

- Every cell wrapped in double quotes
- Internal double quotes escaped as `""`
- JSON fields on a single line, no line breaks
- Boolean fields: `true`, `false`, or blank
- `images`: official venue website URL only, or blank

---

## File Naming

`{town-slug}-{category-slug}.csv`

Examples:
- `guildford-pubs-bars.csv`
- `woking-restaurants.csv`
- `farnham-cafes-brunch.csv`
- `esher-things-to-do.csv`

---

## Email

Send each completed CSV to **sam@samcheeseman.com**
Subject: `BestSurrey import — [Town] [Category] ([n] listings)`
e.g. `BestSurrey import — Guildford Pubs & Bars (10 listings)`

Send each batch as soon as it is done. Do not wait.
