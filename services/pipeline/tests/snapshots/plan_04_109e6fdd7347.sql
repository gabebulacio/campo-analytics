with c1 as (
  select
    field.admin1 as admin1,
    count(distinct luc_assessment.field_id) as value
  from marts.fct_luc_assessment as luc_assessment
  left join marts.dim_field as field on field.field_id = luc_assessment.field_id
  left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
  where luc_assessment.is_latest = true
    and luc_assessment.luc_result = 'conversion_detected'
    and standard.standard_id in ('ISCC')
  group by field.admin1
),
spine as (
  select admin1 from c1
)
select
  spine.admin1 as admin1,
  coalesce(c1.value, 0) as fields_with_conversion
from spine
left join c1 on c1.admin1 is not distinct from spine.admin1
order by fields_with_conversion desc nulls last, admin1 asc
limit 5001