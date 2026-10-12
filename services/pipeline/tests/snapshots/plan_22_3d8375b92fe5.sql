with c1 as (
  select
    date_trunc('month', form_dispatch.sent_at) as dispatch_month,
    count(form_dispatch.dispatch_id) as value
  from marts.fct_form_dispatch as form_dispatch
  where form_dispatch.responded_at is not null
    and form_dispatch.responded_at <= form_dispatch.sent_at + interval '14 days'
    and form_dispatch.channel in ('whatsapp')
  group by date_trunc('month', form_dispatch.sent_at)
),
c2 as (
  select
    date_trunc('month', form_dispatch.sent_at) as dispatch_month,
    count(form_dispatch.dispatch_id) as value
  from marts.fct_form_dispatch as form_dispatch
  where form_dispatch.channel in ('whatsapp')
  group by date_trunc('month', form_dispatch.sent_at)
),
spine as (
  select dispatch_month from c1
  union
  select dispatch_month from c2
)
select
  spine.dispatch_month as dispatch_month,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as form_response_rate
from spine
left join c1 on c1.dispatch_month is not distinct from spine.dispatch_month
left join c2 on c2.dispatch_month is not distinct from spine.dispatch_month
order by dispatch_month asc
limit 5001