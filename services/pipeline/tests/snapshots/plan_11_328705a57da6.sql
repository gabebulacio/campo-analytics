with c1 as (
  select
    field_season.crop as crop,
    sum(field_season.production_t) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where campaign.campaign_id in ('2024/25')
  group by field_season.crop
),
spine as (
  select crop from c1
)
select
  spine.crop as crop,
  coalesce(c1.value, 0) as production_t
from spine
left join c1 on c1.crop is not distinct from spine.crop
order by production_t desc nulls last, crop asc
limit 5001