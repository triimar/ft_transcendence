#!/bin/bash

mkdir db_redis
mkdir db_sql
docker-compose -f docker-compose.yaml up -d --build

