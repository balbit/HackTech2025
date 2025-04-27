#!/bin/bash
poetry install
poetry run uvicorn src.backend.main:app --port 8080 --host 0.0.0.0