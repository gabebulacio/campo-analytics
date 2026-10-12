with c1 as (
  select
    standard.standard_id as standard,
    sum(lot_origin.volume_t) as value
  from marts.bridge_lot_field_season as lot_origin
  left join marts.fct_field_season as field_season on field_season.field_season_id = lot_origin.field_season_id
  left join marts.fct_compliance_evaluation as compliance_evaluation on compliance_evaluation.field_season_id = field_season.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  where compliance_evaluation.compliance_status = 'compliant'
  group by standard.standard_id
),
c2 as (
  select
    sum(lot.volume_t) as value
  from marts.fct_lot as lot
),
spine as (
  select standard from c1
)
select
  spine.standard as standard,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as compliant_volume_share
from spine
left join c1 on c1.standard is not distinct from spine.standard
cross join c2
order by compliant_volume_share desc nulls last, standard asc
limit 5001