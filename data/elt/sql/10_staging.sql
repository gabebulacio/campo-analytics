-- Staging: type casting, renaming, de-duplication. One model per raw table.
-- Portable SQL (DuckDB + Postgres).

create table staging.stg_standards as
select standard_id, standard_name, standard_family, cast(nullif(luc_cutoff_date, '') as date) as luc_cutoff_date
from raw.standards;

create table staging.stg_clients as
select client_id, client_name, client_segment, hq_country, data_origin
from raw.clients;

create table staging.stg_campaigns as
select campaign_id, hemisphere, cast(start_date as date) as start_date, cast(end_date as date) as end_date
from raw.campaigns;

create table staging.stg_programs as
select program_id, client_id, program_name, commodity, origin_country, cast(started_on as date) as started_on, data_origin
from raw.programs;

create table staging.stg_program_standards as
select distinct program_id, standard_id
from raw.program_standards;

create table staging.stg_producers as
select producer_id, size_band as producer_size_band, preferred_channel, country, admin1,
       cast(onboarded_at as date) as onboarded_at, data_origin
from raw.producers;

create table staging.stg_fields as
select field_id, producer_id, geom_geojson, round(cast(area_ha as numeric), 2) as area_ha,
       country, admin1, admin2, biome, geometry_valid, data_origin
from raw.fields;

create table staging.stg_crop_stories as
select field_season_id, field_id, campaign as campaign_id, program_id, crop,
       planted_ha, harvested_ha, production_t, coalesce(n_applied_kg, 0) as n_applied_kg, n_removed_kg,
       kgco2e as emissions_kgco2e, no_till, cover_crop, crop_rotation,
       status as crop_story_status, cast(signed_at as timestamp) as signed_at, anchor_tx_hash,
       required_total as required_fields_total, required_filled as required_fields_filled, data_origin
from raw.crop_stories;

create table staging.stg_luc_assessments as
select luc_assessment_id, field_id, standard_id, cast(assessed_at as timestamp) as assessed_at, is_latest,
       luc_result, converted_ha_after_cutoff, cast(cutoff_date as date) as cutoff_date, report_pdf_uri, data_origin
from raw.luc_assessments;

create table staging.stg_compliance_evaluations as
select field_season_id, standard_id, compliance_status, missing_requirements,
       cast(evaluated_at as timestamp) as evaluated_at, data_origin
from raw.compliance_evaluations;

create table staging.stg_satellite_alerts as
select alert_id, field_id, alert_type, severity, cast(detected_at as timestamp) as detected_at,
       cast(resolved_at as timestamp) as resolved_at, resolution, source, data_origin
from raw.satellite_alerts;

create table staging.stg_inspections as
select inspection_id, field_id, inspection_mode, cast(inspected_at as timestamp) as inspected_at, cost_usd, data_origin
from raw.inspections;

create table staging.stg_form_dispatches as
select dispatch_id, producer_id, program_id, form_type, channel, cast(sent_at as timestamp) as sent_at,
       cast(responded_at as timestamp) as responded_at, data_origin
from raw.form_dispatches;

create table staging.stg_lots as
select lot_id, program_id, site_id, site_type, commodity, cast(registered_at as timestamp) as registered_at,
       volume_t, segregated, qr_scans, data_origin
from raw.lots;

create table staging.stg_lot_origins as
select lot_id, field_season_id, sum(volume_t) as volume_t
from raw.lot_origins
group by lot_id, field_season_id;
