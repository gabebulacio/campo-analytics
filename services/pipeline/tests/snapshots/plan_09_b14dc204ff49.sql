with c1 as (
  select
    compliance_evaluation.compliance_status as compliance_status,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  where compliance_evaluation.compliance_status <> 'not_applicable'
    and standard.standard_id in ('GHG_PROTOCOL')
  group by compliance_evaluation.compliance_status
),
spine as (
  select compliance_status from c1
)
select
  spine.compliance_status as compliance_status,
  coalesce(c1.value, 0) as evaluated_field_seasons
from spine
left join c1 on c1.compliance_status is not distinct from spine.compliance_status
order by evaluated_field_seasons desc nulls last, compliance_status asc
limit 5001