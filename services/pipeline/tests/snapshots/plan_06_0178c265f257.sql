with c1 as (
  select
    program.program_name as program,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  left join marts.dim_program as program on program.program_id = field_season.program_id
  where compliance_evaluation.compliance_status = 'compliant'
    and standard.standard_id in ('EUDR')
    and campaign.campaign_id in ('2024/25')
  group by program.program_name
),
c2 as (
  select
    program.program_name as program,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  left join marts.dim_program as program on program.program_id = field_season.program_id
  where compliance_evaluation.compliance_status <> 'not_applicable'
    and standard.standard_id in ('EUDR')
    and campaign.campaign_id in ('2024/25')
  group by program.program_name
),
spine as (
  select program from c1
  union
  select program from c2
)
select
  spine.program as program,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as compliance_rate
from spine
left join c1 on c1.program is not distinct from spine.program
left join c2 on c2.program is not distinct from spine.program
order by compliance_rate desc nulls last, program asc
limit 5001