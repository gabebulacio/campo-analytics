with c1 as (
  select biome, sum(v) as value from (
    select field.biome as biome,
      field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_field_season as field_season
    left join marts.dim_field as field on field.field_id = field_season.field_id
    where field.geometry_valid = true
    group by field.biome, field.field_id
  ) as s group by biome
),
spine as (
  select biome from c1
)
select
  spine.biome as biome,
  coalesce(c1.value, 0) as monitored_hectares
from spine
left join c1 on c1.biome is not distinct from spine.biome
order by monitored_hectares desc nulls last, biome asc
limit 5001