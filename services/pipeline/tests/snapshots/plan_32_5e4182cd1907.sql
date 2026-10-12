with c1 as (
  select
    program.program_name as program,
    sum(lot_origin.volume_t) as value
  from marts.bridge_lot_field_season as lot_origin
  left join marts.fct_lot as lot on lot.lot_id = lot_origin.lot_id
  left join marts.dim_program as program on program.program_id = lot.program_id
  group by program.program_name
),
c2 as (
  select
    program.program_name as program,
    sum(lot.volume_t) as value
  from marts.fct_lot as lot
  left join marts.dim_program as program on program.program_id = lot.program_id
  group by program.program_name
),
spine as (
  select program from c1
  union
  select program from c2
)
select
  spine.program as program,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as origin_coverage
from spine
left join c1 on c1.program is not distinct from spine.program
left join c2 on c2.program is not distinct from spine.program
order by origin_coverage desc nulls last, program asc
limit 5001