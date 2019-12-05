#!/bin/bash
set -e

psql -U lne_user -d lne -f /docker-entrypoint-initdb.d/scripts/tables/posts.pgsql
psql -U lne_user -d lne -f /docker-entrypoint-initdb.d/scripts/tables/comments.pgsql
psql -U lne_user -d lne -f /docker-entrypoint-initdb.d/scripts/tables/posts_votes.pgsql
