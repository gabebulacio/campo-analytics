with c1 as (
  select
    program.commodity as commodity,
    sum(lot.volume_t) as value
  from marts.fct_lot as lot
  left join marts.dim_program as program on program.program_id = lot.program_id
  where lot.segregated = true
  group by program.commodity
),
c2 as (
  select
    program.commodity as commodity,
    sum(lot.volume_t) as value
  from marts.fct_lot as lot
  left join marts.dim_program as program on program.program_id = lot.program_id
  group by program.commodity
),
spine as (
  select commodity from c1
  union
  select commodity from c2
)
select
  spine.commodity as commodity,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as segregated_volume_share
from spine
left join c1 on c1.commodity is not distinct from spine.commodity
left join c2 on c2.commodity is not distinct from spine.commodity
order by segregated_volume_share desc nulls last, commodity asc
limit 5001