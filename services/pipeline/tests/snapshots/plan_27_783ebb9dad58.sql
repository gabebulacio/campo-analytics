with c1 as (
  select
    satellite_alert.severity as alert_severity,
    count(satellite_alert.alert_id) as value
  from marts.fct_satellite_alert as satellite_alert
  where satellite_alert.resolution = 'false_positive'
  group by satellite_alert.severity
),
c2 as (
  select
    satellite_alert.severity as alert_severity,
    count(satellite_alert.alert_id) as value
  from marts.fct_satellite_alert as satellite_alert
  where satellite_alert.resolved_at is not null
  group by satellite_alert.severity
),
spine as (
  select alert_severity from c1
  union
  select alert_severity from c2
)
select
  spine.alert_severity as alert_severity,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as false_positive_rate
from spine
left join c1 on c1.alert_severity is not distinct from spine.alert_severity
left join c2 on c2.alert_severity is not distinct from spine.alert_severity
order by false_positive_rate desc nulls last, alert_severity asc
limit 5001