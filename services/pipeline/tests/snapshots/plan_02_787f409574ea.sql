with c1 as (
  select biome, sum(v) as value from (
    select field.biome as biome,
      field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_luc_assessment as luc_assessment
    left join marts.dim_field as field on field.field_id = luc_assessment.field_id
    left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
    where luc_assessment.is_latest = true
      and luc_assessment.luc_result = 'no_conversion'
      and standard.standard_id in ('EUDR')
    group by field.biome, field.field_id
  ) as s group by biome
),
c2 as (
  select biome, sum(v) as value from (
    select field.biome as biome,
      field.field_id as distinct_key,
      max(field.area_ha) as v
    from marts.fct_luc_assessment as luc_assessment
    left join marts.dim_field as field on field.field_id = luc_assessment.field_id
    left join marts.dim_standard as standard on standard.standard_id = luc_assessment.standard_id
    where luc_assessment.is_latest = true
      and standard.standard_id in ('EUDR')
    group by field.biome, field.field_id
  ) as s group by biome
),
spine as (
  select biome from c1
  union
  select biome from c2
)
select
  spine.biome as biome,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as deforestation_free_share
from spine
left join c1 on c1.biome is not distinct from spine.biome
left join c2 on c2.biome is not distinct from spine.biome
order by deforestation_free_share desc nulls last, biome asc
limit 5001