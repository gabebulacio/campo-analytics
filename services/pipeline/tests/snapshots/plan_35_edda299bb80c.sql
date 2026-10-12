with c1 as (
  select
    sum(field_season.planted_ha) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  where field.country in ('AR')
),
c2 as (
  select
    count(distinct field.producer_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  where field.country in ('AR')
)
select
  coalesce(c1.value, 0) as planted_hectares,
  coalesce(c2.value, 0) as active_producers
from c1
cross join c2
limit 5001