with c1 as (
  select
    campaign.campaign_id as campaign,
    sum(field_season.emissions_kgco2e / 1000.0) as value
  from marts.fct_field_season as field_season
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  group by campaign.campaign_id
),
spine as (
  select campaign from c1
)
select
  spine.campaign as campaign,
  coalesce(c1.value, 0) as total_emissions_tco2e
from spine
left join c1 on c1.campaign is not distinct from spine.campaign
order by campaign asc
limit 5001