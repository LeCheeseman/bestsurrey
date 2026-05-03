"""
Fix all import CSVs before bulk import:
1. Remap non-standard entity_type values to valid ones
2. Strip invalid subcategory slugs not in the taxonomy
Run from project root: python3 drizzle/import/fix-csvs.py
"""

import csv, glob, os, sys

# ── Entity type mapping ───────────────────────────────────────────────────────
ENTITY_MAP = {
    # Restaurants / pubs / bars
    'restaurant':              'restaurant',
    'pub':                     'restaurant',
    'bar':                     'restaurant',
    'gastropub':               'restaurant',
    'pub_restaurant':          'restaurant',
    'wine_bar':                'restaurant',
    # Cafés
    'cafe':                    'cafe',
    'bakery':                  'cafe',
    # Activity venues
    'activity_venue':          'activity-venue',
    'activity_centre':         'activity-venue',
    'bowling_alley':           'activity-venue',
    'indoor_play_centre':      'activity-venue',
    'leisure_centre':          'activity-venue',
    'sports_activity_location':'activity-venue',
    'sports_club':             'activity-venue',
    'cinema':                  'activity-venue',
    'movie_theater':           'activity-venue',
    'theatre':                 'activity-venue',
    'performing_arts_theater': 'activity-venue',
    # Attractions
    'attraction':              'attraction',
    'tourist_attraction':      'attraction',
    'historical_landmark':     'attraction',
    'art_gallery':             'attraction',
    'arts_centre':             'attraction',
    'museum':                  'attraction',
    'farm':                    'attraction',
    'zoo':                     'attraction',
    'garden':                  'attraction',
    'park':                    'attraction',
    'forest':                  'attraction',
    'walk':                    'attraction',
    'hiking_area':             'attraction',
    'outdoor_activity':        'attraction',
    'boat_hire':               'attraction',
    'playground':              'attraction',
    'library':                 'attraction',
    # Place (catch-all)
    'shopping_centre':         'place',
}

# ── Valid subcategory slugs ───────────────────────────────────────────────────
VALID_SUBCATEGORY_SLUGS = {
    # Restaurants
    'fine-dining', 'casual-dining', 'date-night', 'family-dining',
    'sunday-roast', 'vegan-restaurants', 'vegetarian-restaurants',
    'takeaway', 'brunch',
    # Pubs & Bars
    'gastropubs', 'traditional-pubs', 'country-pubs', 'beer-gardens',
    'wine-bars', 'cocktail-bars', 'sports-bars',
    # Cafés & Brunch
    'coffee-shops', 'brunch-spots', 'bakeries', 'tea-rooms',
    # Things To Do
    'walks-nature', 'historic-sites', 'gardens-parks', 'days-out',
    'arts-culture', 'entertainment', 'cycling',
    # Kids & Family
    'soft-play', 'farms-animals', 'outdoor-play', 'museums-education',
    'arts-crafts', 'theme-parks', 'holiday-activities',
    # Indoor Activities
    'escape-rooms', 'bowling', 'go-karting', 'climbing', 'mini-golf',
    'laser-tag', 'trampoline-parks', 'axe-throwing', 'virtual-reality',
}

SKIP_FILES = {'listings-template.csv', 'listings.csv', 'bestsurrey-work-tracker.csv',
              'guildford-activity-venues.csv', 'guildford-kids-activities.csv'}

def fix_subcategory_slugs(raw: str) -> str:
    if not raw.strip():
        return ''
    parts = [s.strip() for s in raw.split('|') if s.strip()]
    valid = [s for s in parts if s in VALID_SUBCATEGORY_SLUGS]
    return '|'.join(valid)

def fix_entity_type(raw: str) -> str:
    mapped = ENTITY_MAP.get(raw.strip())
    if not mapped:
        print(f"  ⚠️  Unknown entity_type '{raw}' → defaulting to 'place'")
        return 'place'
    return mapped

data_dir = 'drizzle/data'
files = sorted(glob.glob(f'{data_dir}/*.csv'))

total_fixed = 0
total_rows  = 0

for filepath in files:
    filename = os.path.basename(filepath)
    if filename in SKIP_FILES:
        continue

    with open(filepath, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(csv.DictReader(open(filepath)).fieldnames or [])

    if not rows or 'entity_type' not in fieldnames:
        continue

    changed = 0
    for row in rows:
        original_et  = row.get('entity_type', '')
        original_sub = row.get('subcategory_slugs', '')

        new_et  = fix_entity_type(original_et)
        new_sub = fix_subcategory_slugs(original_sub)

        if new_et != original_et or new_sub != original_sub:
            row['entity_type']       = new_et
            row['subcategory_slugs'] = new_sub
            changed += 1

    if changed:
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)
        print(f"  ✓ {filename} — fixed {changed}/{len(rows)} rows")
        total_fixed += changed
    else:
        print(f"  · {filename} — no changes")

    total_rows += len(rows)

print(f"\nDone. Fixed {total_fixed} rows across {len(files)} files.")
