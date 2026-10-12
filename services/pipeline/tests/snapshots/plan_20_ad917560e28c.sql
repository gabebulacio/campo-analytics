with c1 as (
  select
    form_dispatch.form_type as form_type,
    count(form_dispatch.dispatch_id) as value
  from marts.fct_form_dispatch as form_dispatch
  group by form_dispatch.form_type
),
c2 as (
  select
    form_dispatch.form_type as form_type,
    count(form_dispatch.dispatch_id) as value
  from marts.fct_form_dispatch as form_dispatch
  where form_dispatch.responded_at is not null
    and form_dispatch.responded_at <= form_dispatch.sent_at + interval '14 days'
  group by form_dispatch.form_type
),
spine as (
  select form_type from c1
  union
  select form_type from c2
)
select
  spine.form_type as form_type,
  coalesce(c1.value, 0) as forms_sent,
  cast(coalesce(c2.value, 0) as double precision) / nullif(c1.value, 0) as form_response_rate
from spine
left join c1 on c1.form_type is not distinct from spine.form_type
left join c2 on c2.form_type is not distinct from spine.form_type
order by forms_sent desc nulls last, form_type asc
limit 5001