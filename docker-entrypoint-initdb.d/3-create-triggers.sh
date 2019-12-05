#!/bin/bash
set -e

psql -U lne_user -d lne -f /docker-entrypoint-initdb.d/scripts/triggers/vote_trigger.pgsql
