with c1 as (
  select
    client.client_name as client,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_program as program on program.program_id = field_season.program_id
  left join marts.dim_client as client on client.client_id = program.client_id
  where compliance_evaluation.compliance_status = 'compliant'
    and standard.standard_id in ('REGEN_KPI')
  group by client.client_name
),
c2 as (
  select
    client.client_name as client,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_program as program on program.program_id = field_season.program_id
  left join marts.dim_client as client on client.client_id = program.client_id
  where compliance_evaluation.compliance_status <> 'not_applicable'
    and standard.standard_id in ('REGEN_KPI')
  group by client.client_name
),
spine as (
  select client from c1
  union
  select client from c2
)
select
  spine.client as client,
  coalesce(c1.value, 0) as compliant_field_seasons,
  coalesce(c2.value, 0) as evaluated_field_seasons
from spine
left join c1 on c1.client is not distinct from spine.client
left join c2 on c2.client is not distinct from spine.client
order by compliant_field_seasons desc nulls last, client asc
limit 5001