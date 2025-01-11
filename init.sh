#!/bin/bash

mkdir -p pgadmin
docker-compose -f docker-compose.yaml up -d --build

