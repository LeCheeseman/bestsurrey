# OpenClaw Research Brief — BestSurrey.co.uk

## What You Are Doing

You are researching and compiling listing data for **bestsurrey.co.uk**, a curated local directory for Surrey, UK. Your job is to find real, high-quality businesses and venues across Surrey, extract structured data about them, and output that data as a correctly formatted CSV file.

Each CSV you produce will be imported directly into the website database. The format must be exact — column names, valid values, and JSON structures must all match this specification precisely.

When each batch is complete, **email the CSV file to sam@samcheeseman.com** with the subject line: `BestSurrey import — [Town] [Category] ([count] listings)` e.g. `BestSurrey import — Guildford Restaurants (12 listings)`

---

## Batching Order

Work through the following batches in order. Complete one batch fully before starting the next. Aim for **10–15 listings per batch** — prioritise quality and completeness over quantity.

### Priority order:
1. **Guildford — Restaurants** ← Start here
2. Guildford — Cafés & Brunch
3. Guildford — Things To Do
4. Guildford — Kids Activities
5. Guildford — Activity Venues
6. Woking — Restaurants
7. Woking — Cafés & Brunch
8. Woking — Things To Do
9. Farnham — Restaurants
10. Farnham — Cafés & Brunch
11. Reigate — Restaurants
12. Reigate — Things To Do
13. Epsom — Restaurants
14. Dorking — Restaurants
15. Dorking — Things To Do
16. Weybridge — Restaurants
17. Cobham — Restaurants

---

## Research Process (per batch)

1. **Find candidates** — Search Google Maps, TripAdvisor, and the venue's own website for the top businesses in that town and category. Prioritise places that are well-reviewed, locally known, and have a real web presence.

2. **Visit each listing's own website** — The venue's own site is the most reliable source for opening hours, address, contact details, and descriptions. Use it as the primary source.

3. **Cross-reference Google Maps** — Use for coordinates (lat/long), reviews count, price band, and to confirm opening hours.

4. **Write editorial content** — For `short_summary`, `why_we_like_it`, `highlights`, and `best_for`, write original, editorial copy in the style of a knowledgeable local guide. Do not copy text verbatim from review sites.

5. **Output the CSV** — Follow the exact format below.

---

## CSV Format

### File naming
Name each file: `[town]-[category].csv`
e.g. `guildford-restaurants.csv`, `guildford-cafes-brunch.csv`

### Column headers (exact, case-sensitive)

```
name,slug,town_slug,category_slug,entity_type,status,address_line1,address_line2,postcode,latitude,longitude,website_url,phone_number,short_summary,long_description,why_we_like_it,highlights,best_for,family_friendly,dog_friendly,vegan_friendly,vegetarian_friendly,wheelchair_accessible,indoor,outdoor,good_for_groups,booking_required,price_band,parking,featured,sponsored,editorial_score,category_fit_score,review_score,review_count,subcategory_slugs,opening_hours,faq
```

---

## Field Reference

### Required fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Official business name | `The Ivy Guildford` |
| `slug` | URL-safe identifier — lowercase, hyphens only, no special chars | `the-ivy-guildford` |
| `town_slug` | Must be one of the valid town slugs below | `guildford` |
| `category_slug` | Must be one of the valid category slugs below | `restaurants` |
| `entity_type` | Must be one of the valid entity types below | `restaurant` |
| `status` | Always set to `published` | `published` |

### Valid town slugs
```
guildford
woking
farnham
reigate
epsom
dorking
weybridge
cobham
```

### Valid category slugs
```
restaurants
cafes-brunch
kids-activities
things-to-do
activity-venues
```

### Valid entity types
```
restaurant       → use for restaurants, pubs, gastropubs
cafe             → use for cafés, coffee shops, tea rooms, bakeries
attraction       → use for museums, historic sites, gardens, parks, walks
activity-venue   → use for go-karting, bowling, escape rooms, climbing etc.
place            → use for anything that doesn't fit the above
```

---

### Location fields

| Field | Description | Example |
|-------|-------------|---------|
| `address_line1` | Street address | `High Street` |
| `address_line2` | Optional second line | `Town Centre` |
| `postcode` | UK postcode | `GU1 3AJ` |
| `latitude` | Decimal degrees, 6dp | `51.236418` |
| `longitude` | Decimal degrees, 6dp | `-0.570398` |

Get lat/long from Google Maps — right-click a pin and copy the coordinates.

---

### Contact fields

| Field | Description | Example |
|-------|-------------|---------|
| `website_url` | Full URL including https:// | `https://theivyguildford.com` |
| `phone_number` | UK format | `01483 123456` |

---

### Content fields

| Field | Description | Notes |
|-------|-------------|-------|
| `short_summary` | 1–2 sentence description for cards and meta. Max 160 chars. | Write original copy |
| `long_description` | 2–4 paragraph editorial description | Write original copy. Use `\n\n` between paragraphs |
| `why_we_like_it` | Single punchy sentence — the hook. Used as a pull quote. | e.g. `The best wood-fired pizza in Surrey, with a garden made for summer evenings.` |
| `highlights` | Pipe-separated list of 3–6 bullet points | `Wood-fired pizza\|Lovely garden\|Dog friendly terrace` |
| `best_for` | Pipe-separated tags for what the place suits | `Date night\|Summer evenings\|Pizza lovers` |

**Content quality notes:**
- `why_we_like_it` should read like a recommendation from a friend, not a PR blurb
- `highlights` should be specific and factual, not generic ("Great food" is bad; "Stone-baked sourdough pizzas" is good)
- `best_for` should help users self-select — think of who would love this place

---

### Boolean attribute fields

Use `true` or `false`. Leave blank if unknown.

| Field | What it means |
|-------|---------------|
| `family_friendly` | Welcomes children, has high chairs / kids menu |
| `dog_friendly` | Dogs allowed inside or in a dedicated area |
| `vegan_friendly` | Dedicated vegan menu items (not just salad) |
| `vegetarian_friendly` | Good vegetarian options |
| `wheelchair_accessible` | Step-free entrance and accessible facilities |
| `indoor` | Has indoor seating / is an indoor venue |
| `outdoor` | Has outdoor seating / garden / terrace |
| `good_for_groups` | Suitable for groups of 6+, private dining etc. |
| `booking_required` | Booking strongly recommended or required |

---

### Commercial fields

| Field | Valid values | Notes |
|-------|-------------|-------|
| `price_band` | `£` `££` `£££` `££££` | Use Google Maps / menu prices as guide |
| `parking` | `free` `paid` `street` `none` | Nearest available parking type |

**Price band guide:**
- `£` — under £15 per head
- `££` — £15–35 per head
- `£££` — £35–60 per head
- `££££` — £60+ per head / fine dining

---

### Editorial / ranking fields

| Field | Description | Default |
|-------|-------------|---------|
| `featured` | Set `true` for standout picks (max 2–3 per batch) | `false` |
| `sponsored` | Always `false` unless instructed otherwise | `false` |
| `editorial_score` | Your quality rating 1–10 | `7` for most solid places |
| `category_fit_score` | How well it fits the category 1–10 | `8` for most |
| `review_score` | Average review score 0.0–5.0 (from Google Maps) | Leave blank if unsure |
| `review_count` | Number of Google reviews | Leave blank if unsure |

---

### Subcategory slugs

Pipe-separated. Choose the most relevant subcategories from the list below. Only use subcategories that belong to the listing's parent category.

**For `restaurants`:**
```
vegan-restaurants
vegetarian-restaurants
fine-dining
casual-dining
pubs-gastropubs
brunch
date-night
family-dining
takeaway
```

**For `cafes-brunch`:**
```
coffee-shops
brunch-spots
bakeries
tea-rooms
```

**For `kids-activities`:**
```
soft-play
outdoor-play
farms-animals
museums-education
arts-crafts
indoor-kids-activities
outdoor-kids-activities
```

**For `things-to-do`:**
```
walks-nature
historic-sites
gardens-parks
entertainment
days-out
```

**For `activity-venues`:**
```
go-karting
bowling
mini-golf
climbing
laser-tag
escape-rooms
swimming
```

---

### Opening hours format

The `opening_hours` field must be a JSON string. Use this exact structure:

```json
{"monday":{"open":"09:00","close":"17:00"},"tuesday":{"open":"09:00","close":"17:00"},"wednesday":{"open":"09:00","close":"17:00"},"thursday":{"open":"09:00","close":"17:00"},"friday":{"open":"09:00","close":"22:00"},"saturday":{"open":"10:00","close":"22:00"},"sunday":{"open":"10:00","close":"16:00"}}
```

- Use 24-hour time (`HH:MM`)
- For closed days, omit the day key entirely (do not include `"monday": null`)
- Days: `monday` `tuesday` `wednesday` `thursday` `friday` `saturday` `sunday`
- The entire JSON must be on a single line with no line breaks
- Wrap the whole thing in double quotes in the CSV (the CSV cell value is a JSON string)

**Example for a restaurant closed Mondays:**
```
{"tuesday":{"open":"12:00","close":"22:00"},"wednesday":{"open":"12:00","close":"22:00"},"thursday":{"open":"12:00","close":"22:00"},"friday":{"open":"12:00","close":"23:00"},"saturday":{"open":"12:00","close":"23:00"},"sunday":{"open":"12:00","close":"21:00"}}
```

---

### FAQ format

Optional. If the venue has common questions (parking, booking, dietary options), include 2–4 FAQ items as a JSON array:

```json
[{"question":"Do you take walk-ins?","answer":"Yes, walk-ins are welcome but booking is recommended at weekends."},{"question":"Is there parking nearby?","answer":"The closest car park is Friary Street NCP, a 3-minute walk away."}]
```

- Questions should be what a real visitor would ask
- Answers should be concise and factual (1–2 sentences)
- The entire JSON must be on a single line
- Leave blank if you can't find reliable FAQ information

---

## CSV formatting rules

1. **Wrap every field in double quotes** — this prevents commas inside addresses or descriptions from breaking the CSV
2. **Escape internal double quotes** by doubling them: `""` inside a quoted field
3. **No line breaks inside cells** — all content for one listing must be on one row
4. **For JSON fields** (`opening_hours`, `faq`): the JSON goes inside the quoted cell. Do not add extra escaping beyond the standard CSV quoting rules
5. **For pipe-separated fields** (`highlights`, `best_for`, `subcategory_slugs`): use `|` with no spaces around it
6. **For boolean fields**: use `true` or `false` (lowercase), or leave the cell empty if unknown
7. **Slug rules**: lowercase only, hyphens instead of spaces, no apostrophes/ampersands/special characters. Examples:
   - `The White Hart` → `the-white-hart`
   - `Bill's Restaurant` → `bills-restaurant`
   - `Café Rouge` → `cafe-rouge`
   - `Pizza & Pasta Co.` → `pizza-pasta-co`

---

## Example row

Here is a complete example row showing all fields correctly formatted for a Guildford restaurant:

```csv
"The Ivy Guildford","the-ivy-guildford","guildford","restaurants","restaurant","published","The Tunsgate Quarter, High Street","","GU1 3QT","51.236418","-0.570398","https://theivycollection.com/restaurants/the-ivy-guildford","01483 679679","A glamorous all-day brasserie in the heart of Guildford, known for its beautiful interiors and crowd-pleasing menu.","Set within the historic Tunsgate Quarter, The Ivy Guildford brings the famous London brand to Surrey with considerable style. The menu spans brunch through to late-night dining, with something to suit every occasion.\n\nExpect the signature theatrical interiors — bold artwork, plush seating and atmospheric lighting — that the Ivy brand is known for. The kitchen delivers dependable, well-executed classics: dressed crab, burgers, pasta, and a selection of daily specials.\n\nService is polished and the atmosphere consistently buzzy, making it a reliable choice for celebrations, date nights or simply an indulgent lunch.","Theatrical interiors and a crowd-pleasing brasserie menu that rarely disappoints.","Beautiful interiors|All-day dining|Celebrations and birthdays|Weekend brunch|Cocktail bar","true","false","false","true","true","true","false","true","true","£££","paid","true","false","8","8","4.2","1840","date-night|casual-dining","{"monday":{"open":"09:00","close":"22:30"},"tuesday":{"open":"09:00","close":"22:30"},"wednesday":{"open":"09:00","close":"22:30"},"thursday":{"open":"09:00","close":"22:30"},"friday":{"open":"09:00","close":"23:00"},"saturday":{"open":"09:00","close":"23:00"},"sunday":{"open":"09:00","close":"22:00"}}","[{"question":"Do you take walk-ins?","answer":"Walk-ins are welcome subject to availability, but booking is recommended especially at weekends."},{"question":"Is there parking nearby?","answer":"The closest car parks are Tunsgate and Bedford Road, both within a few minutes walk."}]"
```

---

## Quality checklist before sending

Before emailing each CSV, check:

- [ ] All rows have `name`, `slug`, `town_slug`, `category_slug`, `entity_type`, `status`
- [ ] `status` is `published` on all rows
- [ ] All slugs are unique within the file and follow the slug rules
- [ ] `town_slug` and `category_slug` use only the valid values listed above
- [ ] `entity_type` uses only the valid values listed above
- [ ] `opening_hours` JSON is valid and on a single line (test at jsonlint.com if unsure)
- [ ] `faq` JSON is valid and on a single line if present
- [ ] Boolean fields are `true`, `false`, or blank — never `yes`/`no`
- [ ] `price_band` is `£`, `££`, `£££`, or `££££` — never `cheap` or `expensive`
- [ ] `subcategory_slugs` uses only slugs valid for that category
- [ ] No listings are duplicated (each slug appears only once)
- [ ] At least 8 of the content fields are filled for each listing (not just the required 5)

---

## Email instructions

When each batch is complete:
- **To:** sam@samcheeseman.com
- **Subject:** `BestSurrey import — [Town] [Category] ([count] listings)`
  - e.g. `BestSurrey import — Guildford Restaurants (12 listings)`
- **Body:** Brief summary — how many listings, any notes on data gaps or listings you couldn't complete
- **Attachment:** The CSV file named `[town]-[category].csv`

Do not wait until all batches are done — send each CSV as soon as it is complete.

---

## Notes and edge cases

- **Chains vs independents:** Include well-known chains (Ivy, Bills, Côte) if they have a strong local presence, but prioritise independents — they are what makes the directory distinctive
- **Permanently closed venues:** Skip them entirely. If you're unsure, check Google Maps "Permanently closed" label
- **Missing data:** It's better to leave a field blank than to guess. Do not invent phone numbers, addresses, or opening hours
- **Images:** Leave the `images` field blank — images are handled separately
- **Surrey-only:** Only include venues physically located within Surrey. Do not include venues just outside the county boundary even if they serve the Surrey area
