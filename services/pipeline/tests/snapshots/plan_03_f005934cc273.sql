with c1 as (
  select
    standard.standard_id as standard,
    sum(luc_assessment.converted_ha_after_cutoff) as value
  from marts.fct_luc_assessment as luc_assessment
  left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
  where luc_assessment.is_latest = true
  group by standard.standard_id
),
spine as (
  select standard from c1
)
select
  spine.standard as standard,
  coalesce(c1.value, 0) as converted_hectares_after_cutoff
from spine
left join c1 on c1.standard is not distinct from spine.standard
order by converted_hectares_after_cutoff desc nulls last, standard asc
limit 5001