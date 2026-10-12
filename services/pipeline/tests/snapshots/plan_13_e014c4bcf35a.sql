with c1 as (
  select
    producer.producer_size_band as producer_size,
    sum(field_season.n_removed_kg) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  left join marts.dim_producer as producer on producer.producer_id = field.producer_id
  where field_season.n_applied_kg > 0
    and field_season.n_removed_kg is not null
  group by producer.producer_size_band
),
c2 as (
  select
    producer.producer_size_band as producer_size,
    sum(field_season.n_applied_kg) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  left join marts.dim_producer as producer on producer.producer_id = field.producer_id
  where field_season.n_applied_kg > 0
    and field_season.n_removed_kg is not null
  group by producer.producer_size_band
),
spine as (
  select producer_size from c1
  union
  select producer_size from c2
)
select
  spine.producer_size as producer_size,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as nue
from spine
left join c1 on c1.producer_size is not distinct from spine.producer_size
left join c2 on c2.producer_size is not distinct from spine.producer_size
order by nue desc nulls last, producer_size asc
limit 5001