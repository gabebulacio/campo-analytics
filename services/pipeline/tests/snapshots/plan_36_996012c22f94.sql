with c1 as (
  select
    satellite_alert.alert_type as alert_type,
    count(satellite_alert.alert_id) as value
  from marts.fct_satellite_alert as satellite_alert
  where date_trunc('month', satellite_alert.detected_at) between cast('2026-01-01' as timestamp) and cast('2026-09-30' as timestamp)
  group by satellite_alert.alert_type
),
spine as (
  select alert_type from c1
)
select
  spine.alert_type as alert_type,
  coalesce(c1.value, 0) as alerts
from spine
left join c1 on c1.alert_type is not distinct from spine.alert_type
order by alerts desc nulls last, alert_type asc
limit 5001