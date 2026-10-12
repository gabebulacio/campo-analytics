with c1 as (
  select
    program.commodity as commodity,
    sum(field_season.emissions_kgco2e) as value
  from marts.fct_field_season as field_season
  left join marts.dim_program as program on program.program_id = field_season.program_id
  where field_season.emissions_kgco2e is not null
    and field_season.production_t > 0
  group by program.commodity
),
c2 as (
  select
    program.commodity as commodity,
    sum(field_season.production_t) as value
  from marts.fct_field_season as field_season
  left join marts.dim_program as program on program.program_id = field_season.program_id
  where field_season.emissions_kgco2e is not null
    and field_season.production_t > 0
  group by program.commodity
),
spine as (
  select commodity from c1
  union
  select commodity from c2
)
select
  spine.commodity as commodity,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as emissions_intensity
from spine
left join c1 on c1.commodity is not distinct from spine.commodity
left join c2 on c2.commodity is not distinct from spine.commodity
order by emissions_intensity desc nulls last, commodity asc
limit 5001