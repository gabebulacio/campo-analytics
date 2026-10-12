with c1 as (
  select
    satellite_alert.alert_type as alert_type,
    percentile_cont(0.5) within group (order by extract(epoch from (satellite_alert.resolved_at - satellite_alert.detected_at)) / 86400.0) as value
  from marts.fct_satellite_alert as satellite_alert
  where satellite_alert.resolved_at is not null
  group by satellite_alert.alert_type
),
spine as (
  select alert_type from c1
)
select
  spine.alert_type as alert_type,
  c1.value as median_alert_resolution_days
from spine
left join c1 on c1.alert_type is not distinct from spine.alert_type
order by median_alert_resolution_days desc nulls last, alert_type asc
limit 5001