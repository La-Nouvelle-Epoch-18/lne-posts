CREATE TABLE posts.posts_votes
(
    post integer NOT NULL,
    author integer NOT NULL,
    negative boolean NOT NULL,
    CONSTRAINT posts_votes_pkey PRIMARY KEY (post, author),
    CONSTRAINT "fk-posts_votes-posts" FOREIGN KEY (post)
        REFERENCES posts.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE posts.posts_votes
    OWNER to lne_user;

GRANT ALL ON TABLE posts.posts_votes TO lne_user;