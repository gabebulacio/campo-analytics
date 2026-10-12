with c1 as (
  select
    campaign.campaign_id as campaign,
    count(distinct field_season.field_season_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where field_season.crop_story_status in ('complete','signed')
  group by campaign.campaign_id
),
c2 as (
  select
    campaign.campaign_id as campaign,
    count(distinct field_season.field_season_id) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  group by campaign.campaign_id
),
spine as (
  select campaign from c1
  union
  select campaign from c2
)
select
  spine.campaign as campaign,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as crop_story_completion_rate
from spine
left join c1 on c1.campaign is not distinct from spine.campaign
left join c2 on c2.campaign is not distinct from spine.campaign
order by campaign asc
limit 5001