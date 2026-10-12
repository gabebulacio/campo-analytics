with c1 as (
  select
    date_trunc('month', lot.registered_at) as lot_month,
    sum(lot.volume_t) as value
  from marts.fct_lot as lot
  group by date_trunc('month', lot.registered_at)
),
spine as (
  select lot_month from c1
)
select
  spine.lot_month as lot_month,
  coalesce(c1.value, 0) as traced_volume_t
from spine
left join c1 on c1.lot_month is not distinct from spine.lot_month
order by lot_month asc
limit 5001