#!/bin/bash
poetry install
poetry run uvicorn src.backend.main:app --port 8080