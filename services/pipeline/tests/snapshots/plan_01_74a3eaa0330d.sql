with c1 as (
  select standard, sum(v) as value from (
    select standard.standard_id as standard,
      field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_luc_assessment as luc_assessment
    left join marts.dim_field as field on field.field_id = luc_assessment.field_id
    left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
    where luc_assessment.is_latest = true
    group by standard.standard_id, field.field_id
  ) as s group by standard
),
c2 as (
  select standard, sum(v) as value from (
    select standard.standard_id as standard,
      field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_luc_assessment as luc_assessment
    left join marts.dim_field as field on field.field_id = luc_assessment.field_id
    left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
    where luc_assessment.is_latest = true
      and luc_assessment.luc_result = 'no_conversion'
    group by standard.standard_id, field.field_id
  ) as s group by standard
),
spine as (
  select standard from c1
  union
  select standard from c2
)
select
  spine.standard as standard,
  coalesce(c1.value, 0) as assessed_hectares,
  coalesce(c2.value, 0) as deforestation_free_hectares
from spine
left join c1 on c1.standard is not distinct from spine.standard
left join c2 on c2.standard is not distinct from spine.standard
order by assessed_hectares desc nulls last, standard asc
limit 5001