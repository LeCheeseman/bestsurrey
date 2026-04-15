# 05 — Page Template Definitions

## Shared elements (all templates)

- `<SiteHeader>` — logo + primary nav
- `<SiteFooter>` — category/town links, legal
- `<Breadcrumbs>` — on all pages except homepage
- Canonical `<link>` tag
- JSON-LD schema block
- Open Graph + Twitter card meta tags

---

## Template 1: Homepage (`/`)

### Purpose
Brand entry point. Route users into categories and towns. Surface top picks.

### H1
`"The finest places in Surrey"`
or
`"Best Surrey — Discover the finest in the county"`

### Meta title
`"Best Surrey — Restaurants, Activities & Things To Do"`

### Meta description
`"The curated guide to the best restaurants, cafés, activities and things to do across Surrey."`

### Content blocks (top to bottom)

| Block | Description |
|-------|-------------|
| Hero | Logo + tagline + short strapline + CTA "Start exploring" |
| Category tiles | 5 category cards with icon, name, listing count |
| Town tiles | 8 town cards with name, top-line description |
| Featured listings | 3–6 hand-picked listings across categories (admin-controlled) |
| Latest guides | 3 most recent editorial roundups |
| Explore by attribute | Tag cloud or icon grid: family friendly, dog friendly, vegan, etc. |
| Footer CTA | "Can't find what you're looking for? Try search." |

### Internal links from this page
- All 5 category pages
- All 8 town pages
- Each featured listing page
- Each guide page
- Search

---

## Template 2: Category page (`/[category]/`)

### Purpose
Rank for broad category queries. Gateway into subcategories and town-filtered views.

### H1 pattern
`"Best [Category] in Surrey"`
e.g. `"Best Restaurants in Surrey"`

### Meta title pattern
`"Best [Category] in Surrey | Best Surrey"`

### Meta description pattern
`"Discover the best [category] across Surrey. Curated and ranked by the Best Surrey team."`

### Content blocks

| Block | Description |
|-------|-------------|
| Page intro | H1 + 2–3 sentence intro (editorial, not AI boilerplate) |
| Top listings | Ranked listing cards (top 8–12), paginated |
| Subcategory links | Pill or card links to all subcategories in this category |
| Browse by town | Town filter row (links to /[town]/[category]/) |
| Featured banner | If any sponsored listings exist, shown with "Featured" label |
| Related guides | Any roundups tagged to this category |

### Internal links from this page
- All subcategory pages for this category
- All `/[town]/[category]/` pages for this category
- Individual listing pages (via cards)
- Related guide pages

---

## Template 3: Town hub (`/[town]/`)

### Purpose
Rank for town-level discovery. Route users into all category views for that town.

### H1 pattern
`"Best Places in [Town]"`
e.g. `"Best Places in Guildford"`

### Meta title pattern
`"Best Places in [Town] — Eat, Drink & Explore | Best Surrey"`

### Meta description pattern
`"The best restaurants, activities and things to do in [Town], Surrey. Curated picks and local favourites."`

### Content blocks

| Block | Description |
|-------|-------------|
| Town intro | H1 + 2–3 sentence editorial intro to the town |
| Category grid | Cards for each category (links to /[town]/[category]/) |
| Top picks | 4–6 featured or highest-ranked listings in this town |
| On the map | Google Maps embed centred on the town, pinning top picks |

### Internal links from this page
- All `/[town]/[category]/` pages
- Top listing pages for this town
- Parent category pages (sidebar or footer links)

---

## Template 4: Town + category page (`/[town]/[category]/`)

### Purpose
Primary SEO landing pages. Target high-intent local queries.

### H1 pattern
`"Best [Category] in [Town]"`
e.g. `"Best Restaurants in Guildford"`

### Meta title pattern
`"Best [Category] in [Town], Surrey | Best Surrey"`

### Meta description pattern
`"The best [category] in [Town]. Curated picks, ranked by quality and local knowledge."`

### Content blocks

| Block | Description |
|-------|-------------|
| Page intro | H1 + custom intro (from `category_town_overrides` if set, else generated) |
| Top listings | Ranked listing cards for this town + category (top 8–12) |
| Subcategory links | Filter to subcategories within this category |
| Nearby towns | Links to same category in neighbouring towns |
| Map | Google Maps embed with listings pinned |
| FAQ | 2–4 FAQs (e.g. "What's the best restaurant in Guildford?") |

### Internal links from this page
- Listing detail pages (via cards)
- Subcategory pages (e.g. /surrey/vegan-restaurants/)
- Parent category page
- Parent town page
- Same category in other towns

---

## Template 5: Subcategory page (`/surrey/[subcategory]/`)

### Purpose
Capture narrow high-intent county-wide searches.

### H1 pattern
`"Best [Subcategory Name] in Surrey"`
e.g. `"Best Vegan Restaurants in Surrey"` or `"Best Go-Karting in Surrey"`

### Meta title pattern
`"Best [Subcategory] in Surrey | Best Surrey"`

### Content blocks

| Block | Description |
|-------|-------------|
| Page intro | H1 + 2-sentence intro |
| Top listings | Ranked listing cards matching this subcategory |
| Browse by town | Quick-filter links to town pages with this subcategory |
| Related categories | Links to sibling subcategories |
| FAQ | 2–3 FAQs specific to this subcategory |

### Internal links from this page
- Listing pages (via cards)
- Parent category page
- Town + category pages

---

## Template 6: Listing page (`/listings/[slug]/`)

### Purpose
Rank for branded and local search. Provide detailed, structured information on a single place.

### H1 pattern
`"[Listing Name]"`
(The location and category context is carried by the breadcrumbs and surrounding copy.)

### Meta title pattern
`"[Listing Name] — [Town] [Category] | Best Surrey"`
e.g. `"The Ivy Cobham Brasserie — Cobham Restaurant | Best Surrey"`

### Content blocks

| Block | Description |
|-------|-------------|
| Hero | Primary image + name + short_summary + badges (featured, sponsored if applicable) |
| Key info bar | Price band · Category · Town · Booking required · Accessibility |
| Attribute badges | Visual tags: family friendly, dog friendly, vegan, etc. |
| Editorial section | `why_we_like_it` + `highlights` bullets + `long_description` |
| Best for | `best_for` array displayed as tag pills |
| Opening hours | Structured table from `opening_hours` JSONB |
| Map | Google Maps embed using lat/lng |
| Contact / Links | Website button, phone, address |
| Gallery | Image carousel from `images` JSONB (if multiple images) |
| FAQ | Accordion from `faq` JSONB (if populated) |
| Sponsored label | Clearly labelled if `sponsored = true` |
| Related listings | 3 related listings (same town + category) |
| Breadcrumb | Home → Category → Town+Category → Listing name |

### Sponsored/featured labelling
- `featured = true` → subtle "Editor's Pick" badge
- `sponsored = true` → clearly visible "Sponsored" label, distinct styling, not in organic ranking

---

## Template 7: Editorial roundup (`/guides/[slug]/`)

### Purpose
Capture editorial long-tail searches. Drive internal links into category and listing pages.

### H1 pattern
The roundup title as written.
e.g. `"Best Date Night Restaurants in Surrey"`

### Meta title pattern
`"[Roundup Title] | Best Surrey"`

### Content blocks

| Block | Description |
|-------|-------------|
| Intro | H1 + `intro` field (editorial copy) |
| Listing entries | Ordered list of listings with `editorial_note`, image, and link |
| Body copy | `body` field (editorial prose between listings if needed) |
| Related guides | 2–3 links to related roundup pages |
| Category CTA | "See all [Category] in Surrey" link |

---

## Listing card component (shared across templates)

Used on all index pages. Consistent across templates.

| Element | Source field |
|---------|-------------|
| Image | `images[0]` (primary image) |
| Name | `name` |
| Location | `town.name` |
| Category | `primary_category.name` |
| Price band | `price_band` |
| Short summary | `short_summary` |
| Attribute badges | Top 3 most relevant from attributes |
| "Featured" label | `featured = true` |
| "Sponsored" label | `sponsored = true` (distinct style) |
| Ranking position | Position number (1, 2, 3...) shown on "best of" pages |

---

## Page states to handle

| State | Behaviour |
|-------|-----------|
| Empty town + category | Show empty state with category-level fallback links |
| Single listing in town | Still render the page; don't suppress it |
| No custom intro | Fall back to generated intro pattern |
| Listing with no image | Show placeholder image or category icon |
| Listing not published | 404 |
| Town or category not found | 404 with suggested alternatives |
