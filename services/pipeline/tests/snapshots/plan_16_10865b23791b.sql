with c1 as (
  select
    field.country as country,
    count(distinct field.producer_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  group by field.country
),
spine as (
  select country from c1
)
select
  spine.country as country,
  coalesce(c1.value, 0) as active_producers
from spine
left join c1 on c1.country is not distinct from spine.country
order by active_producers desc nulls last, country asc
limit 5001