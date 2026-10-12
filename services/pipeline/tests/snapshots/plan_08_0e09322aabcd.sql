with c1 as (
  select
    field_season.crop_story_status as crop_story_status,
    count(distinct compliance_evaluation.field_season_id) as value
  from marts.fct_compliance_evaluation as compliance_evaluation
  left join marts.fct_field_season as field_season on field_season.field_season_id = compliance_evaluation.field_season_id
  left join marts.dim_standard as standard on standard.standard_id = compliance_evaluation.standard_id
  where compliance_evaluation.compliance_status = 'pending_evidence'
    and standard.standard_id in ('EUDR')
  group by field_season.crop_story_status
),
spine as (
  select crop_story_status from c1
)
select
  spine.crop_story_status as crop_story_status,
  coalesce(c1.value, 0) as pending_evidence_field_seasons
from spine
left join c1 on c1.crop_story_status is not distinct from spine.crop_story_status
order by pending_evidence_field_seasons desc nulls last, crop_story_status asc
limit 5001