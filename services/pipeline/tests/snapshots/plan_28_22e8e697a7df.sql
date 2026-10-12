with c1 as (
  select
    field.country as country,
    count(inspection.inspection_id) as value
  from marts.fct_inspection as inspection
  left join marts.dim_field as field on field.field_id = inspection.field_id
  where inspection.inspection_mode = 'remote'
  group by field.country
),
c2 as (
  select
    field.country as country,
    count(inspection.inspection_id) as value
  from marts.fct_inspection as inspection
  left join marts.dim_field as field on field.field_id = inspection.field_id
  group by field.country
),
spine as (
  select country from c1
  union
  select country from c2
)
select
  spine.country as country,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as remote_inspection_share
from spine
left join c1 on c1.country is not distinct from spine.country
left join c2 on c2.country is not distinct from spine.country
order by remote_inspection_share desc nulls last, country asc
limit 5001