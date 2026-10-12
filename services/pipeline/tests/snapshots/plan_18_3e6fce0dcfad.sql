with c1 as (
  select
    program.program_name as program,
    count(distinct field_season.field_season_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_program as program on program.program_id = field_season.program_id
  where field_season.crop_story_status = 'signed'
  group by program.program_name
),
c2 as (
  select
    program.program_name as program,
    count(distinct field_season.field_season_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_program as program on program.program_id = field_season.program_id
  group by program.program_name
),
spine as (
  select program from c1
  union
  select program from c2
)
select
  spine.program as program,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as signed_crop_story_share
from spine
left join c1 on c1.program is not distinct from spine.program
left join c2 on c2.program is not distinct from spine.program
order by signed_crop_story_share desc nulls last, program asc
limit 5001