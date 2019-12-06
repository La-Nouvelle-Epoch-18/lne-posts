CREATE TABLE posts.posts
(
    post_id serial,
    author character varying(40) NOT NULL,
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    content text COLLATE pg_catalog."default" NOT NULL,
    ts timestamp(0) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upvotes integer NOT NULL DEFAULT 0,
    downvotes integer NOT NULL DEFAULT 0,
    expiration timestamp with time zone,
    CONSTRAINT posts_pkey PRIMARY KEY (post_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE posts.posts
    OWNER to lne_user;

GRANT ALL ON TABLE posts.posts TO lne_user;