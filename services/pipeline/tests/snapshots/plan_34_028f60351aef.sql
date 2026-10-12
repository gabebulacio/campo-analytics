with c1 as (
  select
    client.client_name as client,
    sum(lot.qr_scans) as value
  from marts.fct_lot as lot
  left join marts.dim_program as program on program.program_id = lot.program_id
  left join marts.dim_client as client on client.client_id = program.client_id
  group by client.client_name
),
spine as (
  select client from c1
)
select
  spine.client as client,
  coalesce(c1.value, 0) as qr_scans
from spine
left join c1 on c1.client is not distinct from spine.client
order by qr_scans desc nulls last, client asc
limit 5001