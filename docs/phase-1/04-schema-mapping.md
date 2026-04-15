# 04 — Schema Mapping (JSON-LD)

## Principles

- JSON-LD only — no Microdata or RDFa
- Injected via Next.js `<Script>` in each page's `<head>` (or via `metadata` export)
- Generated from structured data, never hand-written
- Every page gets at minimum: `Organization` + `WebSite` (sitewide) + `BreadcrumbList` (page-level)
- Validate with Google Rich Results Test during development

---

## Sitewide schema (rendered once, in root `layout.tsx`)

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Best Surrey",
  "url": "https://bestsurrey.co.uk",
  "logo": "https://bestsurrey.co.uk/images/logo.svg",
  "description": "The finest local guide to Surrey. Curated restaurants, activities, and experiences.",
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "Surrey"
  }
}
```

### WebSite (enables Sitelinks Searchbox signal)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Best Surrey",
  "url": "https://bestsurrey.co.uk",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://bestsurrey.co.uk/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## Per-template schema

---

### Homepage (`/`)

| Schema type | Purpose |
|-------------|---------|
| Organization | Sitewide — injected from root layout |
| WebSite | Sitewide — injected from root layout |

No additional page-level schema needed on the homepage.

---

### Category page (`/[category]/`)

| Schema type | Purpose |
|-------------|---------|
| BreadcrumbList | Home → Category |
| CollectionPage | Signals this is a curated index page |
| ItemList | Lists the top listings on the page |

**BreadcrumbList:**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bestsurrey.co.uk/" },
    { "@type": "ListItem", "position": 2, "name": "Restaurants", "item": "https://bestsurrey.co.uk/restaurants/" }
  ]
}
```

**CollectionPage:**
```json
{
  "@type": "CollectionPage",
  "name": "Best Restaurants in Surrey",
  "description": "The best restaurants across Surrey, curated and ranked.",
  "url": "https://bestsurrey.co.uk/restaurants/"
}
```

**ItemList:** (top N listings from this category)
```json
{
  "@type": "ItemList",
  "name": "Best Restaurants in Surrey",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://bestsurrey.co.uk/listings/the-ivy-cobham/"
    }
  ]
}
```

---

### Town hub (`/[town]/`)

Same schema as Category page, substituting the town name.

**BreadcrumbList:**
```
Home → Guildford
```

**CollectionPage:** describes the town discovery hub.

**ItemList:** top listings across all categories in that town.

---

### Town + category (`/[town]/[category]/`)

Same as Category page.

**BreadcrumbList:**
```
Home → Restaurants → Guildford
```
or
```
Home → Guildford → Restaurants
```
(Use the second — local anchor first, matches URL structure.)

**CollectionPage + ItemList** as above.

---

### Subcategory (`/surrey/[subcategory]/`)

**BreadcrumbList:**
```
Home → Restaurants → Vegan Restaurants in Surrey
```

**CollectionPage + ItemList** as above.

---

### Listing page (`/listings/[slug]/`)

This is the most schema-rich template. Entity type determines which schema.org subtype is used.

#### Entity type → schema.org type mapping

| Entity type | Primary schema type |
|-------------|---------------------|
| `restaurant` | `Restaurant` (extends `FoodEstablishment` extends `LocalBusiness`) |
| `cafe` | `CafeOrCoffeeShop` (extends `FoodEstablishment`) |
| `attraction` | `TouristAttraction` |
| `activity-venue` | `SportsActivityLocation` (extends `LocalBusiness`) |
| `place` | `LocalBusiness` |

#### Core listing schema (Restaurant example)

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "The Ivy Cobham Brasserie",
  "url": "https://bestsurrey.co.uk/listings/the-ivy-cobham/",
  "sameAs": "https://theivycobham.com",
  "description": "A stylish all-day brasserie in the heart of Cobham...",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 Anystreet",
    "addressLocality": "Cobham",
    "addressRegion": "Surrey",
    "postalCode": "KT11 1AA",
    "addressCountry": "GB"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 51.3290,
    "longitude": -0.4120
  },
  "telephone": "+441932 123456",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday"],
      "opens": "12:00",
      "closes": "22:00"
    }
  ],
  "priceRange": "££",
  "servesCuisine": ["Modern British", "European"],
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Wheelchair accessible", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Dog friendly", "value": false }
  ],
  "image": {
    "@type": "ImageObject",
    "url": "https://bestsurrey.co.uk/images/listings/the-ivy-cobham.jpg",
    "width": 1200,
    "height": 630
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "312",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

#### BreadcrumbList for listing pages

```
Home → Restaurants → Guildford Restaurants → The Ivy Cobham Brasserie
```

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://bestsurrey.co.uk/" },
    { "position": 2, "name": "Restaurants", "item": "https://bestsurrey.co.uk/restaurants/" },
    { "position": 3, "name": "Cobham Restaurants", "item": "https://bestsurrey.co.uk/cobham/restaurants/" },
    { "position": 4, "name": "The Ivy Cobham Brasserie" }
  ]
}
```

#### FAQPage (if listing has FAQ field populated)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you need to book?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Booking is recommended, especially at weekends."
      }
    }
  ]
}
```

---

### Editorial roundup (`/guides/[slug]/`)

| Schema type | Purpose |
|-------------|---------|
| BreadcrumbList | Home → Guides → [Guide title] |
| CollectionPage | Marks this as a curated editorial page |
| ItemList | Lists the featured listings with positions |

---

## Schema generation approach

Schema should never be hardcoded strings. Each template gets a schema builder function, e.g.:

```typescript
// lib/schema/listing.ts
export function buildListingSchema(listing: Listing, town: Town): object {
  const baseType = entityTypeToSchemaType(listing.entity_type)
  return {
    "@context": "https://schema.org",
    "@type": baseType,
    name: listing.name,
    // ...
  }
}
```

These functions are called at build time (in `generateMetadata` or a `<JsonLd>` component) and rendered as `<script type="application/ld+json">`.

---

## Validation

- Use Google's Rich Results Test during Phase 3
- Add a dev-mode schema validator that runs against schema.org spec
- Run Lighthouse schema audit before launch
