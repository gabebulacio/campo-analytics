with c1 as (
  select
    inspection.inspection_mode as inspection_mode,
    sum(inspection.cost_usd) as value
  from marts.fct_inspection as inspection
  group by inspection.inspection_mode
),
spine as (
  select inspection_mode from c1
)
select
  spine.inspection_mode as inspection_mode,
  coalesce(c1.value, 0) as inspection_cost_usd
from spine
left join c1 on c1.inspection_mode is not distinct from spine.inspection_mode
order by inspection_cost_usd desc nulls last, inspection_mode asc
limit 5001