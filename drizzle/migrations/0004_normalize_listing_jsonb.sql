-- Normalize early imports that stored JSONB arrays/objects as JSON strings.
-- Safe to re-run: each update only touches scalar JSON strings that parse into
-- the expected shape.

update listings
set images = (images #>> '{}')::jsonb
where images is not null
  and jsonb_typeof(images) = 'string'
  and left(trim(images #>> '{}'), 1) = '[';

update listings
set faq = (faq #>> '{}')::jsonb
where faq is not null
  and jsonb_typeof(faq) = 'string'
  and left(trim(faq #>> '{}'), 1) = '[';

update listings
set opening_hours = (opening_hours #>> '{}')::jsonb
where opening_hours is not null
  and jsonb_typeof(opening_hours) = 'string'
  and left(trim(opening_hours #>> '{}'), 1) = '{';

-- Give existing image records usable alt text where the source left it blank.
update listings l
set images = fixed.images
from (
  select
    l.id,
    jsonb_agg(
      case
        when coalesce(nullif(image.value ->> 'alt', ''), '') = '' then
          jsonb_set(
            image.value,
            '{alt}',
            to_jsonb(l.name || ' in ' || t.name)
          )
        else image.value
      end
      order by image.ordinality
    ) as images
  from listings l
  inner join towns t on t.id = l.town_id
  cross join lateral jsonb_array_elements(l.images) with ordinality as image(value, ordinality)
  where l.images is not null
    and jsonb_typeof(l.images) = 'array'
  group by l.id
) fixed
where fixed.id = l.id;
