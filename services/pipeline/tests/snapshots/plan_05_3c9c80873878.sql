with c1 as (
  select
    standard.standard_id as standard,
    campaign.campaign_id as campaign,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where compliance_evaluation.compliance_status = 'compliant'
  group by standard.standard_id, campaign.campaign_id
),
c2 as (
  select
    standard.standard_id as standard,
    campaign.campaign_id as campaign,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where compliance_evaluation.compliance_status <> 'not_applicable'
  group by standard.standard_id, campaign.campaign_id
),
spine as (
  select standard, campaign from c1
  union
  select standard, campaign from c2
)
select
  spine.standard as standard,
  spine.campaign as campaign,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as compliance_rate
from spine
left join c1 on c1.standard is not distinct from spine.standard and c1.campaign is not distinct from spine.campaign
left join c2 on c2.standard is not distinct from spine.standard and c2.campaign is not distinct from spine.campaign
order by campaign asc, standard asc
limit 5001