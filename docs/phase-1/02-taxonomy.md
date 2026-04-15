# 02 — Taxonomy

## Categories (top-level)

These are the five v1 categories. Slugs are the canonical URL segment.

| Name | Slug | Schema type |
|------|------|-------------|
| Restaurants | `restaurants` | Restaurant |
| Cafés & Brunch | `cafes-brunch` | CafeOrCoffeeShop |
| Kids Activities | `kids-activities` | TouristAttraction / SportsActivityLocation |
| Things To Do | `things-to-do` | TouristAttraction |
| Activity Venues | `activity-venues` | SportsActivityLocation |

---

## Subcategories

Subcategories belong to one parent category. A listing can belong to multiple subcategories.

### Restaurants
| Name | Slug |
|------|------|
| Vegan | `vegan-restaurants` |
| Vegetarian | `vegetarian-restaurants` |
| Fine Dining | `fine-dining` |
| Casual Dining | `casual-dining` |
| Pubs & Gastropubs | `pubs-gastropubs` |
| Brunch | `brunch` |
| Date Night | `date-night` |
| Family Dining | `family-dining` |
| Takeaway | `takeaway` |

### Cafés & Brunch
| Name | Slug |
|------|------|
| Coffee Shops | `coffee-shops` |
| Brunch Spots | `brunch-spots` |
| Bakeries | `bakeries` |
| Tea Rooms | `tea-rooms` |

### Kids Activities
| Name | Slug |
|------|------|
| Soft Play | `soft-play` |
| Outdoor Play | `outdoor-play` |
| Farms & Animals | `farms-animals` |
| Museums & Education | `museums-education` |
| Arts & Crafts | `arts-crafts` |
| Indoor Activities | `indoor-kids-activities` |
| Outdoor Activities | `outdoor-kids-activities` |

### Things To Do
| Name | Slug |
|------|------|
| Walks & Nature | `walks-nature` |
| Historic Sites | `historic-sites` |
| Gardens & Parks | `gardens-parks` |
| Entertainment | `entertainment` |
| Days Out | `days-out` |

### Activity Venues
| Name | Slug |
|------|------|
| Go-Karting | `go-karting` |
| Bowling | `bowling` |
| Mini Golf | `mini-golf` |
| Climbing | `climbing` |
| Laser Tag | `laser-tag` |
| Escape Rooms | `escape-rooms` |
| Swimming | `swimming` |

---

## Towns

All v1 towns are in Surrey. Slugs are used in URLs.

| Name | Slug | Notes |
|------|------|-------|
| Guildford | `guildford` | Largest town — priority |
| Woking | `woking` | Priority |
| Farnham | `farnham` | |
| Reigate | `reigate` | |
| Epsom | `epsom` | |
| Dorking | `dorking` | |
| Weybridge | `weybridge` | |
| Cobham | `cobham` | |

The schema supports `county` and `region` fields to enable expansion beyond Surrey later (e.g. north Surrey villages, border towns).

---

## Entity types

Entity type determines which schema.org type is used and which fields are surfaced prominently on the listing page.

| Entity type | Slug | Schema.org type |
|-------------|------|-----------------|
| Restaurant | `restaurant` | Restaurant |
| Café | `cafe` | CafeOrCoffeeShop |
| Tourist Attraction | `attraction` | TouristAttraction |
| Activity Venue | `activity-venue` | SportsActivityLocation |
| Place / Other | `place` | LocalBusiness |

---

## Tags

Tags are flat, cross-cutting, and can be applied to any listing regardless of category. They power filtered browsing and badge UI on listing cards.

### Experience tags
```
family-friendly
dog-friendly
date-night
good-for-groups
romantic
solo-friendly
```

### Dietary tags
```
vegan-friendly
vegetarian-friendly
gluten-free-options
halal
```

### Access & logistics tags
```
wheelchair-accessible
free-entry
booking-required
parking-available
public-transport
```

### Environment tags
```
indoor
outdoor
indoor-outdoor
```

### Price tags
```
budget-friendly
mid-range
special-occasion
```

---

## Structured attributes

These are boolean or enum fields stored directly on the listing record (not as tags). They are the primary filter inputs and are also surfaced in schema.org output.

| Attribute | Type | Values |
|-----------|------|--------|
| `family_friendly` | boolean | true / false |
| `dog_friendly` | boolean | true / false |
| `vegan_friendly` | boolean | true / false |
| `vegetarian_friendly` | boolean | true / false |
| `wheelchair_accessible` | boolean | true / false |
| `indoor` | boolean | true / false |
| `outdoor` | boolean | true / false |
| `good_for_groups` | boolean | true / false |
| `booking_required` | boolean | true / false |
| `price_band` | enum | `£` `££` `£££` `££££` |
| `parking` | enum | `free` `paid` `street` `none` |
| `age_suitability` | text | e.g. "All ages", "3–12", "18+" |

---

## Taxonomy expansion rules

When adding new categories or towns post-launch:
1. Add the category/town record to the database
2. Add subcategories if needed
3. Update `generateStaticParams` to include new slugs
4. Check for slug collisions with existing town/category slugs in App Router
5. No code changes needed for new tags or attributes — they're data-driven

### Slug collision prevention

Town slugs and category slugs must not overlap. Current check:

- Town slugs: `guildford`, `woking`, `farnham`, `reigate`, `epsom`, `dorking`, `weybridge`, `cobham`
- Category slugs: `restaurants`, `cafes-brunch`, `kids-activities`, `things-to-do`, `activity-venues`

No collisions in v1. Future towns/categories must be checked before adding.
