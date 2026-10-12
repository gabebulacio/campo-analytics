with c1 as (
  select
    campaign.campaign_id as campaign,
    sum(field_season.planted_ha) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where (field_season.no_till::int + field_season.cover_crop::int + field_season.crop_rotation::int) >= 2
  group by campaign.campaign_id
),
c2 as (
  select
    campaign.campaign_id as campaign,
    sum(field_season.planted_ha) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  group by campaign.campaign_id
),
c3 as (
  select
    campaign.campaign_id as campaign,
    sum(field_season.planted_ha) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where field_season.cover_crop = true
  group by campaign.campaign_id
),
spine as (
  select campaign from c1
  union
  select campaign from c2
  union
  select campaign from c3
)
select
  spine.campaign as campaign,
  cast(coalesce(c1.value, 0) as double precision) / nullif(c2.value, 0) as regenerative_adoption_share,
  cast(coalesce(c3.value, 0) as double precision) / nullif(c2.value, 0) as cover_crop_share
from spine
left join c1 on c1.campaign is not distinct from spine.campaign
left join c2 on c2.campaign is not distinct from spine.campaign
left join c3 on c3.campaign is not distinct from spine.campaign
order by campaign asc
limit 5001