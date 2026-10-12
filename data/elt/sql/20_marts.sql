-- Marts: the only schema the query engine can read. Table names match
-- docs/semantic-layer/agri_traceability.yaml (entities.*.table).

create table marts.dim_client as select * from staging.stg_clients;

create table marts.dim_standard as select * from staging.stg_standards;

create table marts.dim_program as select * from staging.stg_programs;

create table marts.bridge_program_standard as select * from staging.stg_program_standards;

create table marts.dim_producer as select * from staging.stg_producers;

create table marts.dim_field as select * from staging.stg_fields;

create table marts.dim_campaign as select * from staging.stg_campaigns;

create table marts.fct_field_season as select * from staging.stg_crop_stories;

create table marts.fct_luc_assessment as select * from staging.stg_luc_assessments;

create table marts.fct_compliance_evaluation as select * from staging.stg_compliance_evaluations;

create table marts.fct_satellite_alert as select * from staging.stg_satellite_alerts;

create table marts.fct_inspection as select * from staging.stg_inspections;

create table marts.fct_form_dispatch as select * from staging.stg_form_dispatches;

create table marts.fct_lot as select * from staging.stg_lots;

create table marts.bridge_lot_field_season as select * from staging.stg_lot_origins;
