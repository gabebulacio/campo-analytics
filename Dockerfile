# Pipeline service (FastAPI) for Cloud Run.
#   gcloud run deploy pipeline --source . --region southamerica-east1 ...
# The synthetic data and the DuckDB marts are built at image build time
# (seeded, ~10 s), so the service needs no external database. Set
# DATABASE_URL_READER to switch the executor to Neon Postgres instead.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /srv

COPY services/pipeline/requirements.txt services/pipeline/requirements.txt
RUN pip install --no-cache-dir -r services/pipeline/requirements.txt

COPY docs/semantic-layer/agri_traceability.yaml docs/semantic-layer/agri_traceability.yaml
COPY data/generator data/generator
COPY data/elt data/elt
COPY services/pipeline/app services/pipeline/app
COPY evals/golden evals/golden

RUN python data/generator/generate.py \
 && python data/elt/run.py \
 && rm -rf data/out/raw data/out/flat \
 && cd services/pipeline && python -c "from app import values; values.build()"

WORKDIR /srv/services/pipeline
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1
