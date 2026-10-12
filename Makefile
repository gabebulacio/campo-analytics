# Thin wrapper; the logic lives in tasks.py so Windows (no make) works too.
PY ?= python

.PHONY: setup seed reference elt dev test evals schemas
setup: ; $(PY) tasks.py setup
seed: ; $(PY) tasks.py seed
elt: ; $(PY) tasks.py elt
dev: ; $(PY) tasks.py dev
test: ; $(PY) tasks.py test
evals: ; $(PY) tasks.py evals
schemas: ; $(PY) tasks.py schemas
reference: ; @echo "Phase 1b (Earth Engine reference layers) is not built yet - see docs/decisions/0004-interview-cut.md"
