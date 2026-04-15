# 07 — Editorial Workflow

## Roles (v1)

| Role | Capabilities |
|------|-------------|
| `editor` | Create/edit listings and roundups, submit for review |
| `admin` | All editor rights + publish/unpublish, feature, mark sponsored, adjust ranking inputs, manage taxonomy |

No public accounts in v1. Both roles use Supabase Auth (email/password or magic link).

---

## Listing lifecycle

```
[Draft] → [In Review] → [Published]
                ↓
           [Unpublished]   ← can be re-published
```

### Status definitions

| Status | Meaning |
|--------|---------|
| `draft` | Work in progress. Not visible publicly. Visible to editor/admin. |
| `review` | Complete enough to be reviewed for publication. Not yet live. |
| `published` | Visible publicly. Must have minimum required fields (see below). |
| `unpublished` | Was published, now hidden. Retains all data. Can be re-published. |

### Minimum fields required to publish

A listing cannot be moved to `published` without:
- `name`
- `slug`
- `entity_type`
- `primary_category_id`
- `town_id`
- `short_summary`
- At least one image in `images`
- `address_line1` or `latitude`/`longitude`

The admin UI should enforce this with a pre-publish validation check.

---

## Content creation flow

### 1. Seed / import
- Listing record created with `status = 'draft'`
- Identity fields populated from source data (name, address, postcode, lat/lng, website, phone)
- Structured attributes populated where known

### 2. AI-assisted enrichment
- `short_summary`, `long_description`, `highlights`, `why_we_like_it`, `faq` drafted using AI
- AI output stored in draft fields — never auto-published
- AI should NOT be used to generate: `review_score`, `review_count`, addresses, opening hours

### 3. Editorial review
- Editor reviews AI drafts, rewrites where needed
- Sets: `editorial_score`, `category_fit_score`, `price_band`, `best_for`, tags
- Adds images
- Marks listing as `status = 'review'`

### 4. Admin sign-off
- Admin reviews the listing
- Optionally sets `featured = true`
- Sets `published_at` = now()
- Sets `status = 'published'`

### 5. Live and visible
- Listing appears on category, town, town+category, and subcategory pages
- Listing page accessible at `/listings/[slug]/`
- Sitemap updated at next build/revalidation

---

## Roundup / guide workflow

1. Admin or editor creates a new roundup record with title, slug, and intro
2. Selects listings to include (from published listings only) with sort order
3. Adds optional `editorial_note` per listing
4. Sets `status = 'review'` or `'published'` directly
5. Guide appears at `/guides/[slug]/`

---

## Featured listings

- `featured = true` is set by admin only
- Featured listings appear:
  - In the homepage "Featured" section (up to 6)
  - At the top of relevant category/town+category pages (max 1–2, labelled)
- Featured status is independent of `ranking_score` — a featured listing can appear above higher-ranked listings but must be visually distinct

## Sponsored listings

- `sponsored = true` is set by admin only
- Sponsored listings must display a "Sponsored" label — always visible, never ambiguous
- Sponsored listings are excluded from "ranked" positions (1st, 2nd, 3rd labels)
- They appear in a clearly separated block at the top or side of relevant pages
- This rule is enforced in the template, not just the UI — the listing card component renders differently when `sponsored = true`

---

## Ranking inputs management

Admins can adjust per-listing ranking inputs from the admin panel:
- `editorial_score` (0–10 slider)
- `category_fit_score` (0–10 slider)
- `review_score` (numeric input, sourced externally)
- `review_count` (numeric input)

`ranking_score` is recomputed automatically via DB trigger when any of these change.

---

## Batch operations (Phase 6+)

For efficient seeding at scale:
- CSV import → creates listings with `status = 'draft'`
- Batch AI enrichment → fills content fields, marks for review
- Batch review queue — editor sees all listings in `status = 'review'` ordered by completeness
- Batch publish — admin can publish multiple listings at once after review

---

## Content quality rules

- No listing should be published with only AI-generated content that hasn't been reviewed
- All `why_we_like_it` fields should sound human and specific, not generic
- Images must be properly licensed (own photography, press images with permission, or stock)
- Addresses and opening hours must be verified against the business's own website before publishing
- `review_score` and `review_count` should cite their source (Google, TripAdvisor) in `editorial_notes`

---

## Audit trail (Phase 5 admin)

The admin panel should record:
- Who created a listing
- Who last edited it
- Who published it
- When each status change occurred

In v1 this can be lightweight (Supabase Auth user ID stored on the listing record + `updated_at`). A full `listing_history` audit table can be added in Phase 5 if needed.
