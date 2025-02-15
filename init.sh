#!/bin/bash

mkdir -p db_sql
mkdir -p pgadmin
docker compose -f docker-compose.yaml up -d --build

