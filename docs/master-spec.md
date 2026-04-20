# BestSurrey — Master Specification
*Single source of truth for taxonomy, URL structure, content model and import requirements.*

---

## 1. Categories (confirmed)

| # | Display Name | Slug | Entity Types | What It Covers |
|---|---|---|---|---|
| 1 | Restaurants | `restaurants` | `restaurant` | All sit-down dining, all cuisines, Sunday roasts |
| 2 | Pubs & Bars | `pubs-bars` | `restaurant` | Traditional pubs, gastropubs, wine bars, cocktail bars, beer gardens |
| 3 | Cafés & Brunch | `cafes-brunch` | `cafe` | Coffee shops, independent cafés, brunch spots, bakeries, tea rooms |
| 4 | Things To Do | `things-to-do` | `attraction` | Walks, nature, historic sites, gardens, parks, days out, heritage |
| 5 | Kids & Family | `kids-family` | `attraction` / `activity-venue` | Soft play, farms, animal encounters, museums, outdoor play, theme parks |
| 6 | Indoor Activities | `indoor-activities` | `activity-venue` | Bowling, escape rooms, go-karting, climbing, mini golf, laser tag, trampolining |

> **Note for import:** `kids-activities` and `activity-venues` are the **old slugs** — do not use them. Use `kids-family` and `indoor-activities` only.

---

## 2. Subcategories

### Restaurants (`restaurants`)
| Slug | Display Name |
|---|---|
| `fine-dining` | Fine Dining |
| `casual-dining` | Casual Dining |
| `date-night` | Date Night |
| `family-dining` | Family Dining |
| `sunday-roast` | Sunday Roast |
| `vegan-restaurants` | Vegan |
| `vegetarian-restaurants` | Vegetarian |
| `takeaway` | Takeaway |
| `brunch` | Brunch |

### Pubs & Bars (`pubs-bars`)
| Slug | Display Name |
|---|---|
| `gastropubs` | Gastropubs |
| `traditional-pubs` | Traditional Pubs |
| `country-pubs` | Country Pubs |
| `beer-gardens` | Beer Gardens |
| `wine-bars` | Wine Bars |
| `cocktail-bars` | Cocktail Bars |
| `sports-bars` | Sports Bars |

### Cafés & Brunch (`cafes-brunch`)
| Slug | Display Name |
|---|---|
| `coffee-shops` | Coffee Shops |
| `brunch-spots` | Brunch Spots |
| `bakeries` | Bakeries |
| `tea-rooms` | Tea Rooms |

### Things To Do (`things-to-do`)
| Slug | Display Name |
|---|---|
| `walks-nature` | Walks & Nature |
| `historic-sites` | Historic Sites |
| `gardens-parks` | Gardens & Parks |
| `days-out` | Days Out |
| `arts-culture` | Arts & Culture |
| `entertainment` | Entertainment |
| `cycling` | Cycling |

### Kids & Family (`kids-family`)
| Slug | Display Name |
|---|---|
| `soft-play` | Soft Play |
| `farms-animals` | Farms & Animals |
| `outdoor-play` | Outdoor Play |
| `museums-education` | Museums & Education |
| `arts-crafts` | Arts & Crafts |
| `theme-parks` | Theme Parks |
| `holiday-activities` | Holiday Activities |

### Indoor Activities (`indoor-activities`)
| Slug | Display Name |
|---|---|
| `escape-rooms` | Escape Rooms |
| `bowling` | Bowling |
| `go-karting` | Go-Karting |
| `climbing` | Climbing |
| `mini-golf` | Mini Golf |
| `laser-tag` | Laser Tag |
| `trampoline-parks` | Trampoline Parks |
| `axe-throwing` | Axe Throwing |
| `virtual-reality` | Virtual Reality |

---

## 3. Towns / Areas

### Tier 1 — Priority now (large population, strong commercial activity)
| Display Name | Slug | Notes |
|---|---|---|
| Guildford | `guildford` | County town, highest search volume |
| Woking | `woking` | Second largest, strong retail/dining |
| Epsom | `epsom` | Racecourse, affluent, good dining |
| Camberley | `camberley` | Large town, strong retail |
| Redhill | `redhill` | Large commuter town |
| Farnham | `farnham` | Independent, affluent, good café scene |

### Tier 2 — Priority soon (affluent, strong dining/leisure scenes)
| Display Name | Slug | Notes |
|---|---|---|
| Reigate | `reigate` | Affluent, great independent scene |
| Godalming | `godalming` | Close to Guildford, independent cafés |
| Leatherhead | `leatherhead` | Growing food scene |
| Cobham | `cobham` | Very affluent, strong restaurants |
| Weybridge | `weybridge` | Affluent, good dining |
| Esher | `esher` | Affluent village, boutique dining |
| Walton-on-Thames | `walton-on-thames` | Large town, good mix |

### Tier 3 — Later (smaller towns, niche appeal)
| Display Name | Slug | Notes |
|---|---|---|
| Dorking | `dorking` | Surrey Hills gateway, good independents |
| Haslemere | `haslemere` | Charming market town |
| Oxted | `oxted` | Village feel, commuter belt |
| Virginia Water | `virginia-water` | Very affluent, few but premium venues |
| Cranleigh | `cranleigh` | Large village, some good independents |
| Staines-upon-Thames | `staines` | Border town, worth including |
| Chertsey | `chertsey` | Smaller, limited but fills the map |

---

## 4. URL Structure

```
/{town-slug}/                          → Town hub page
/{category-slug}/                      → Category index (county-wide)
/{town-slug}/{category-slug}/          → Town × Category page  ← PRIMARY SEO TARGET
/surrey/{subcategory-slug}/            → Subcategory index (county-wide)
/listings/{listing-slug}/              → Individual venue page
/guides/{guide-slug}/                  → Editorial roundup
/guides/                               → Guides index
/search                                → Search (noindex)
```

### Reserved / pre-existing slugs — DO NOT use as town or category slugs
`listings`, `guides`, `search`, `api`, `surrey`

---

## 5. Town × Category Priority Matrix

See accompanying file: `docs/page-matrix.csv`

**Key:** 1 = do now · 2 = do soon · 3 = do later · — = skip (not enough venues)

---

## 6. Content Model

### 6a. Town × Category page
*Type: listing index + editorial intro*
- Generated automatically from listings in DB
- `override` table can supply a custom intro paragraph per town/category combo
- Requires at least **5 published listings** to be worthwhile
- Target: **8–12 listings** per page

### 6b. Category index page (`/{category-slug}/`)
*Type: listing index, county-wide*
- Aggregates best listings across all towns for that category
- Target: **12–20 listings**, ranked by `ranking_score`

### 6c. Individual listing page (`/listings/{slug}/`)
*Type: single venue page*

**Required fields:**
- `name`, `slug`, `town_slug`, `category_slug`, `entity_type`, `status`

**Strongly recommended (affects completeness score):**
- `short_summary` — 1–2 sentences, max 160 chars
- `why_we_like_it` — single pull-quote sentence
- `highlights` — 3–6 pipe-separated bullet points
- `address_line1`, `postcode`
- `website_url`
- `opening_hours` — JSON

**Optional but valuable:**
- `long_description` — 2–4 paragraphs
- `phone_number`
- `latitude`, `longitude`
- `faq` — JSON array
- `best_for` — pipe-separated tags
- `images` — URL from venue's own website

---

## 7. CSV Import Spec

### File naming
`{town-slug}-{category-slug}.csv`
e.g. `guildford-restaurants.csv`, `woking-pubs-bars.csv`

### Column headers (exact, in this order)
```
name,slug,town_slug,category_slug,entity_type,status,address_line1,address_line2,postcode,latitude,longitude,website_url,phone_number,images,short_summary,long_description,why_we_like_it,highlights,best_for,family_friendly,dog_friendly,vegan_friendly,vegetarian_friendly,wheelchair_accessible,indoor,outdoor,good_for_groups,booking_required,price_band,parking,featured,sponsored,editorial_score,category_fit_score,review_score,review_count,subcategory_slugs,opening_hours,faq
```

### Valid values

**`town_slug`** — must be one of:
```
guildford · woking · farnham · reigate · epsom · dorking · weybridge · cobham
godalming · leatherhead · esher · walton-on-thames · camberley · redhill
haslemere · oxted · virginia-water · cranleigh · staines
```

**`category_slug`** — must be one of:
```
restaurants · pubs-bars · cafes-brunch · things-to-do · kids-family · indoor-activities
```
⚠️ Do NOT use `kids-activities` or `activity-venues` — these are retired slugs.

**`entity_type`** — must be one of:
```
restaurant   → restaurants, pubs-bars
cafe         → cafes-brunch
attraction   → things-to-do, kids-family
activity-venue → indoor-activities, kids-family
place        → catch-all fallback only
```

**`status`** — always `published` unless instructed otherwise

**`price_band`** — `£` · `££` · `£££` · `££££` · or blank

**`parking`** — `free` · `paid` · `street` · `none` · or blank

**Boolean fields** — `true` · `false` · or blank (blank = unknown)

### Quoting rules
- Wrap every cell in double quotes
- Internal double quotes: escape as `""`
- No line breaks inside cells
- JSON fields go inside the quoted cell as a single line

### JSON — opening_hours
```json
{"monday":{"open":"09:00","close":"17:00"},"tuesday":{"open":"09:00","close":"17:00"}}
```
- 24-hour time · omit closed days entirely · single line · no line breaks

### JSON — faq
```json
[{"question":"Do you take walk-ins?","answer":"Yes, walk-ins welcome at lunch."}]
```
- 2–4 items · single line · leave blank if unreliable

### images
- Plain URL from the venue's **own website only**
- No TripAdvisor, Google Maps, or third-party image CDNs
- Leave blank if no official image found — do not guess

---

## 8. Coverage Targets

| Category | Listings per town (Tier 1) | Listings per town (Tier 2) | Notes |
|---|---|---|---|
| Restaurants | 10–15 | 6–10 | Most important category |
| Pubs & Bars | 8–12 | 5–8 | Country pubs especially valuable |
| Cafés & Brunch | 8–10 | 4–6 | Independents over chains where possible |
| Things To Do | 8–12 | 5–8 | Mix of free and paid |
| Kids & Family | 6–10 | 4–6 | County-wide attractions OK here |
| Indoor Activities | 4–8 | 2–4 | Fewer venues exist; don't pad with weak entries |

**Quality rule:** A page with 6 strong, well-described listings is better than 12 thin ones. Never add a listing just to hit a number.

**Featured:** Max 2–3 `featured: true` per batch. These appear as Editor's Picks.

---

## 9. Deliverable & Email Instructions

- Email each completed CSV to **sam@samcheeseman.com**
- Subject: `BestSurrey import — [Town] [Category] ([n] listings)`
- One CSV per town/category batch
- Send as soon as complete — do not wait for other batches
- Note any venues you could not verify or where data was incomplete
