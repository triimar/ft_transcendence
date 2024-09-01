#!/bin/bash

docker-compose -f docker-compose.yml down -v --rmi all
docker system prune -af --volumes
