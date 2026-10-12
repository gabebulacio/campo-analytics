with c1 as (
  select
    field.admin1 as admin1,
    count(satellite_alert.alert_id) as value
  from marts.fct_satellite_alert as satellite_alert
  left join marts.dim_field as field on field.field_id = satellite_alert.field_id
  where satellite_alert.resolved_at is null
  group by field.admin1
),
spine as (
  select admin1 from c1
)
select
  spine.admin1 as admin1,
  coalesce(c1.value, 0) as open_alerts
from spine
left join c1 on c1.admin1 is not distinct from spine.admin1
order by open_alerts desc nulls last, admin1 asc
limit 5001