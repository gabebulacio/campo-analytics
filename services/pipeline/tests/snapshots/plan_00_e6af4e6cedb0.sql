with c1 as (
  select sum(v) as value from (
    select field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_luc_assessment as luc_assessment
    left join marts.dim_field as field on field.field_id = luc_assessment.field_id
    left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
    where luc_assessment.is_latest = true
      and standard.standard_id in ('EUDR')
    group by field.field_id
  ) as s
)
select
  coalesce(c1.value, 0) as assessed_hectares
from c1
limit 5001