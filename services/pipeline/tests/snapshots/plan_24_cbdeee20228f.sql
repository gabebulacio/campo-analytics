with c1 as (
  select
    date_trunc('month', satellite_alert.detected_at) as alert_month,
    count(satellite_alert.alert_id) as value
  from marts.fct_satellite_alert as satellite_alert
  where satellite_alert.alert_type in ('deforestation')
  group by date_trunc('month', satellite_alert.detected_at)
),
spine as (
  select alert_month from c1
)
select
  spine.alert_month as alert_month,
  coalesce(c1.value, 0) as alerts
from spine
left join c1 on c1.alert_month is not distinct from spine.alert_month
order by alert_month asc
limit 5001