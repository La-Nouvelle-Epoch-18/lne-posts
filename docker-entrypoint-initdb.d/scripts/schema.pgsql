CREATE SCHEMA posts AUTHORIZATION lne_user;

GRANT ALL ON SCHEMA posts TO lne_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA posts
GRANT ALL ON TABLES TO lne_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA posts
GRANT ALL ON SEQUENCES TO lne_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA posts
GRANT EXECUTE ON FUNCTIONS TO lne_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA posts
GRANT USAGE ON TYPES TO lne_user;