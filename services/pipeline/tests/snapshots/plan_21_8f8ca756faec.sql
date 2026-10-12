with c1 as (
  select
    form_dispatch.channel as channel,
    producer.producer_size_band as producer_size,
    percentile_cont(0.5) within group (order by extract(epoch from (form_dispatch.responded_at - form_dispatch.sent_at)) / 3600.0) as value
  from marts.fct_form_dispatch as form_dispatch
  left join marts.dim_producer as producer on producer.producer_id = form_dispatch.producer_id
  where form_dispatch.responded_at is not null
  group by form_dispatch.channel, producer.producer_size_band
),
spine as (
  select channel, producer_size from c1
)
select
  spine.channel as channel,
  spine.producer_size as producer_size,
  c1.value as median_response_hours
from spine
left join c1 on c1.channel is not distinct from spine.channel and c1.producer_size is not distinct from spine.producer_size
order by median_response_hours desc nulls last, channel asc, producer_size asc
limit 5001