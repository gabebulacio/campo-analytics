with c1 as (
  select
    field_season.crop_story_status as crop_story_status,
    sum(field_season.required_fields_filled) as value
  from marts.fct_field_season as field_season
  group by field_season.crop_story_status
),
c2 as (
  select
    field_season.crop_story_status as crop_story_status,
    sum(field_season.required_fields_total) as value
  from marts.fct_field_season as field_season
  group by field_season.crop_story_status
),
spine as (
  select crop_story_status from c1
  union
  select crop_story_status from c2
)
select
  spine.crop_story_status as crop_story_status,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as data_completeness
from spine
left join c1 on c1.crop_story_status is not distinct from spine.crop_story_status
left join c2 on c2.crop_story_status is not distinct from spine.crop_story_status
order by data_completeness desc nulls last, crop_story_status asc
limit 5001