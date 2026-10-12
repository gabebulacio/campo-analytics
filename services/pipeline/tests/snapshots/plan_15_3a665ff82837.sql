with c1 as (
  select
    field.admin1 as admin1,
    sum(field_season.planted_ha) as value
  from marts.fct_field_season as field_season
  left join marts.dim_field as field on field.field_id = field_season.field_id
  left join marts.dim_campaign as campaign on campaign.campaign_id = field_season.campaign_id
  where field_season.crop in ('soy')
    and campaign.campaign_id in ('2024/25')
  group by field.admin1
),
spine as (
  select admin1 from c1
)
select
  spine.admin1 as admin1,
  coalesce(c1.value, 0) as planted_hectares
from spine
left join c1 on c1.admin1 is not distinct from spine.admin1
order by planted_hectares desc nulls last, admin1 asc
limit 5001